const jwt = require('jsonwebtoken');

const APPLE_SHARED_SECRET = "1e93787defaa4cdda69433a9547fa25f"; // App Store Connect shared secret
const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

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

    const renewal = (json.pending_renewal_info || [])
        .find((r) => r.original_transaction_id === info.original_transaction_id) || {};

    return {
        originalTransactionId: info.original_transaction_id,
        productId: info.product_id,
        expiresDate: new Date(Number(info.expires_date_ms)),
        autoRenewStatus: renewal.auto_renew_status === '1',
        environment: json.environment,
        raw: json,
    };
}

function decodeJws(signedPayload) {
    return jwt.decode(signedPayload);
}

module.exports = { verifyReceipt, decodeJws };
