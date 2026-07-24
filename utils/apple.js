const crypto = require('crypto');
const { X509Certificate } = crypto;

// ---------------------------------------------------------------------------
// Apple StoreKit 2 / App Store Server Notifications V2 verification
//
// The iOS app (in_app_purchase, StoreKit 2) sends a *signed JWS transaction*
// to /verify-purchase, and App Store Server Notifications V2 POST a signed
// JWS `signedPayload` to /apple-notifications. Both are JWS (ES256) whose
// header carries an `x5c` certificate chain that terminates at Apple's root.
//
// We verify these locally (Apple's recommended approach for StoreKit 2 — the
// legacy /verifyReceipt endpoint only accepts StoreKit 1 base64 receipts and
// is deprecated):
//   1. Rebuild the x5c certificate chain and confirm each cert signs the next.
//   2. Pin the chain's root to the real Apple Root CA - G3 (SHA-256 pinned).
//   3. Verify the JWS body signature with the leaf certificate's public key.
//   4. Only then trust the decoded payload.
// ---------------------------------------------------------------------------

// Legacy StoreKit 1 receipt verification (kept as a fallback for old clients
// that still send a base64 app receipt instead of a StoreKit 2 JWS).
const APPLE_SHARED_SECRET = '1e93787defaa4cdda69433a9547fa25f';
const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

// SHA-256 fingerprint of "Apple Root CA - G3" (valid 2014-04-30 .. 2039-04-30).
// This is the trust anchor every StoreKit 2 / ASSN V2 chain must end at.
const APPLE_ROOT_CA_G3_FP =
  '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79';

// Expected app bundle id — a genuine transaction/notification for THIS app must
// carry this bundleId, which stops receipts from other apps being replayed.
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || 'com.stackstatsgeo.app';

// Escape hatch for local development without real Apple certs. Never set this
// in production — it turns off signature verification.
const SKIP_VERIFY = String(process.env.APPLE_JWS_SKIP_VERIFY) === 'true';

function b64urlToJson(segment) {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

/** True when `data` looks like a JWS (StoreKit 2) rather than a SK1 receipt. */
function isJws(data) {
  return typeof data === 'string' && data.split('.').length === 3 && data.startsWith('eyJ');
}

/**
 * Verify a JWS produced by Apple (StoreKit 2 transaction or ASSN V2 payload)
 * and return its decoded JSON body. Throws if anything about the chain or
 * signature is not trustworthy.
 */
function verifyJws(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('Not a valid JWS');
  }
  const [headerB64, payloadB64, sigB64] = token.split('.');

  if (SKIP_VERIFY) {
    console.warn('apple: APPLE_JWS_SKIP_VERIFY=true — skipping signature verification (dev only)');
    return b64urlToJson(payloadB64);
  }

  const header = b64urlToJson(headerB64);
  if (header.alg !== 'ES256') throw new Error(`Unexpected JWS alg: ${header.alg}`);
  if (!Array.isArray(header.x5c) || header.x5c.length < 2) {
    throw new Error('JWS header missing x5c certificate chain');
  }

  const certs = header.x5c.map((der) => new X509Certificate(Buffer.from(der, 'base64')));
  const now = new Date();

  // 1. Every cert must currently be within its validity window.
  for (const cert of certs) {
    if (new Date(cert.validFrom) > now || new Date(cert.validTo) < now) {
      throw new Error('Apple certificate expired or not yet valid');
    }
  }

  // 2. Each cert must be signed by the next one up the chain.
  for (let i = 0; i < certs.length - 1; i++) {
    if (!certs[i].verify(certs[i + 1].publicKey)) {
      throw new Error('Apple certificate chain is broken');
    }
  }

  // 3. The chain must terminate at the pinned Apple Root CA - G3.
  const root = certs[certs.length - 1];
  if (!root.verify(root.publicKey)) throw new Error('Apple root certificate is not self-signed');
  if (root.fingerprint256 !== APPLE_ROOT_CA_G3_FP) {
    throw new Error('Apple root certificate does not match the pinned Apple Root CA - G3');
  }

  // 4. Verify the JWS body signature with the leaf certificate. JWS ECDSA
  //    signatures use the raw r||s (IEEE P1363) encoding.
  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(sigB64, 'base64url');
  const validSig = crypto.verify(
    'sha256',
    signingInput,
    { key: certs[0].publicKey, dsaEncoding: 'ieee-p1363' },
    signature,
  );
  if (!validSig) throw new Error('Apple JWS signature verification failed');

  return b64urlToJson(payloadB64);
}

/**
 * Verify a StoreKit 2 signed transaction JWS and normalise the fields we use.
 */
function decodeSignedTransaction(jws) {
  const tx = verifyJws(jws);

  if (tx.bundleId && tx.bundleId !== APPLE_BUNDLE_ID) {
    throw new Error(`Transaction bundleId "${tx.bundleId}" does not match "${APPLE_BUNDLE_ID}"`);
  }

  return {
    transactionId: tx.transactionId,
    originalTransactionId: tx.originalTransactionId,
    productId: tx.productId,
    // expiresDate is epoch milliseconds; only auto-renewables carry one.
    expiresDate: tx.expiresDate ? new Date(Number(tx.expiresDate)) : null,
    environment: tx.environment, // "Sandbox" | "Production"
    type: tx.type,
    raw: tx,
  };
}

/**
 * Verify an iOS purchase. Accepts a StoreKit 2 JWS transaction (current app)
 * and, for backwards compatibility, a StoreKit 1 base64 receipt.
 *
 * Returns a unified shape used by the purchase-verification controller.
 */
async function verifyIosPurchase(verificationData) {
  if (isJws(verificationData)) {
    const t = decodeSignedTransaction(verificationData);
    return {
      originalTransactionId: t.originalTransactionId,
      productId: t.productId,
      expiresDate: t.expiresDate,
      // A fresh StoreKit 2 purchase is, by definition, auto-renew ON. The
      // authoritative on/off state afterwards arrives via ASSN V2 renewal info.
      autoRenewStatus: true,
      environment: t.environment,
      raw: t.raw,
    };
  }
  // Fallback: legacy StoreKit 1 receipt.
  return verifyReceipt(verificationData);
}

/**
 * Verify an App Store Server Notification V2 `signedPayload` and pull out the
 * fields we act on (subscription lifecycle + expiry + auto-renew state).
 */
function verifyNotification(signedPayload) {
  const payload = verifyJws(signedPayload);
  const data = payload.data || {};

  if (data.bundleId && data.bundleId !== APPLE_BUNDLE_ID) {
    throw new Error(`Notification bundleId "${data.bundleId}" does not match "${APPLE_BUNDLE_ID}"`);
  }

  // ASSN V2 nests the transaction and renewal info as their own signed JWS.
  const tx = data.signedTransactionInfo ? verifyJws(data.signedTransactionInfo) : null;
  const renewal = data.signedRenewalInfo ? verifyJws(data.signedRenewalInfo) : null;

  const autoRenewStatus =
    renewal && renewal.autoRenewStatus != null ? Number(renewal.autoRenewStatus) === 1 : null;

  return {
    notificationType: payload.notificationType,
    subtype: payload.subtype,
    environment: data.environment || payload.environment,
    originalTransactionId: tx ? tx.originalTransactionId : null,
    productId: tx ? tx.productId : null,
    expiresDate: tx && tx.expiresDate ? new Date(Number(tx.expiresDate)) : null,
    autoRenewStatus,
    transaction: tx,
    renewal,
    payload,
  };
}

// --- Legacy StoreKit 1 receipt verification (fallback only) ----------------

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function verifyReceipt(receiptData) {
  if (!APPLE_SHARED_SECRET) throw new Error('APPLE_SHARED_SECRET not configured');

  const body = {
    'receipt-data': receiptData,
    password: APPLE_SHARED_SECRET,
    'exclude-old-transactions': true,
  };

  let json = await postJson(PROD_URL, body);
  if (json.status === 21007) {
    json = await postJson(SANDBOX_URL, body);
  }
  if (!json || json.status !== 0) {
    throw new Error(`Apple verifyReceipt failed, status=${json && json.status}`);
  }

  const info = (json.latest_receipt_info || []).sort(
    (a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms),
  )[0];
  if (!info) throw new Error('No subscription info in receipt');

  const renewal =
    (json.pending_renewal_info || []).find(
      (r) => r.original_transaction_id === info.original_transaction_id,
    ) || {};

  return {
    originalTransactionId: info.original_transaction_id,
    productId: info.product_id,
    expiresDate: new Date(Number(info.expires_date_ms)),
    autoRenewStatus: renewal.auto_renew_status === '1',
    environment: json.environment,
    raw: json,
  };
}

module.exports = {
  verifyIosPurchase,
  decodeSignedTransaction,
  verifyNotification,
  verifyJws,
  verifyReceipt,
  isJws,
};
