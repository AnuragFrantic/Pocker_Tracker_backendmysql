const db = require("../models");
const PurchaseSubscription = db.PurchaseSubscription;
const Subscription = db.Subscription;
const User = db.User;
const Payment = db.Payment;

// CREATE with subscription logic
exports.CreatePurchaseSubscription = async (req, res) => {
    try {
        const { subscription_id, amount_paid, currency } = req.body;

        const user_id = req.user.id

        // 1. Find subscription
        const subscription = await Subscription.findByPk(subscription_id);
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found", error: true });
        }

        // 2. Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + subscription.duration_days);

        // 3. Sessions
        const sessions = subscription.max_sessions || null;
        const remainingSessions = subscription.max_sessions || null;

        // 4. Create purchase
        const newPurchase = await PurchaseSubscription.create({
            user_id,
            subscription_id,
            // payment_reference,
            amount_paid,
            currency: currency || subscription.currency, // fallback to subscription currency
            start_date: startDate,
            end_date: endDate,
            status: "active",
            sessions,
            remaining_sessions: remainingSessions,
            raw_subscription: subscription.toJSON() // save full subscription snapshot
        });

        // 5. Update user session points
        const user = await User.findByPk(user_id);
        if (user) {
            user.session_points = (user.session_points || 0) + sessions; // add purchased sessions
            user.expire_date = endDate;
            await user.save();
        }

        res.status(201).json({
            message: "Purchase Subscription created successfully",
            data: newPurchase,
            error: false,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};


// READ ALL
exports.GetAllPurchaseSubscriptions = async (req, res) => {
    try {
        const purchases = await PurchaseSubscription.findAll({
            include: [
                { model: db.User, as: "user" },
                { model: db.Subscription, as: "subscription" },
                // { model: db.Payment, as: "payment" }
            ]
        });

        res.status(200).json({
            message: "Purchase Subscriptions fetched successfully",
            data: purchases,
            error: false,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};

// READ ONE
exports.GetPurchaseSubscriptionById = async (req, res) => {
    try {
        const purchase = await PurchaseSubscription.findByPk(req.params.id, {
            include: [
                { model: db.User, as: "user" },
                { model: db.Subscription, as: "subscription" },
                { model: db.Payment, as: "payment" }
            ]
        });

        if (!purchase) {
            return res.status(404).json({
                message: "Purchase Subscription not found",
                error: true,
            });
        }

        res.status(200).json({
            message: "Purchase Subscription fetched successfully",
            data: purchase,
            error: false,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};

// UPDATE
exports.UpdatePurchaseSubscription = async (req, res) => {
    try {
        const purchase = await PurchaseSubscription.findByPk(req.params.id);

        if (!purchase) {
            return res.status(404).json({
                message: "Purchase Subscription not found",
                error: true,
            });
        }

        await purchase.update(req.body);

        res.status(200).json({
            message: "Purchase Subscription updated successfully",
            data: purchase,
            error: false,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};

// DELETE
exports.DeletePurchaseSubscription = async (req, res) => {
    try {
        const purchase = await PurchaseSubscription.findByPk(req.params.id);

        if (!purchase) {
            return res.status(404).json({
                message: "Purchase Subscription not found",
                error: true,
            });
        }

        await purchase.destroy();

        res.status(200).json({
            message: "Purchase Subscription deleted successfully",
            error: false,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};
