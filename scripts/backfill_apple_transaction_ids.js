/**
 * One-off backfill: populate Payment.transaction_id for existing iOS purchases.
 *
 * Older iOS payments were stored with transaction_id = NULL because the app
 * sends a StoreKit 2 signed transaction (JWS) that the previous verification
 * code couldn't parse. Apple's renewal notifications match a payment by
 * transaction_id = originalTransactionId, so without this backfill those
 * existing subscribers' auto-renewals can't be reconciled.
 *
 * This decodes each payment's stored `verification_data` JWS, verifies it, and
 * writes the real originalTransactionId. Safe to run multiple times.
 *
 * Usage (from the backend root, with the same env as the server):
 *   node scripts/backfill_apple_transaction_ids.js
 */
const { Op } = require('sequelize');
const db = require('../models');
const { verifyJws, isJws } = require('../utils/apple');

(async () => {
    let updated = 0;
    let skipped = 0;
    try {
        const payments = await db.Payment.findAll({
            where: {
                platform: 'ios',
                verification_data: { [Op.ne]: null },
                [Op.or]: [{ transaction_id: null }, { transaction_id: '' }],
            },
        });

        console.log(`Found ${payments.length} iOS payment(s) missing transaction_id.`);

        for (const payment of payments) {
            const data = payment.verification_data;
            if (!isJws(data)) {
                console.warn(`  payment #${payment.id}: verification_data is not a JWS, skipping`);
                skipped++;
                continue;
            }
            try {
                const tx = verifyJws(data);
                const originalTransactionId = tx.originalTransactionId;
                if (!originalTransactionId) {
                    console.warn(`  payment #${payment.id}: no originalTransactionId in payload, skipping`);
                    skipped++;
                    continue;
                }
                await payment.update({
                    transaction_id: originalTransactionId,
                    product_id: payment.product_id || tx.productId,
                });
                console.log(`  payment #${payment.id}: transaction_id -> ${originalTransactionId}`);
                updated++;
            } catch (err) {
                console.error(`  payment #${payment.id}: verification failed (${err.message}), skipping`);
                skipped++;
            }
        }

        console.log(`\nDone. Updated ${updated}, skipped ${skipped}.`);
    } catch (err) {
        console.error('Backfill failed:', err.message);
        process.exitCode = 1;
    } finally {
        await db.sequelize.close();
    }
})();
