const express = require("express");
const { StripeWebhookHandler } = require("../controllers/PurchaseSubsriptionController");
const router = express.Router();


router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    StripeWebhookHandler
);

module.exports = router;
