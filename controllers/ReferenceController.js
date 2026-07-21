const db = require("../models");

const calculateEndDate = (subscription) => {
    const endDate = new Date();
    if (subscription.duration_type === "days") endDate.setDate(endDate.getDate() + subscription.duration_value);
    else if (subscription.duration_type === "months") endDate.setMonth(endDate.getMonth() + subscription.duration_value);
    else if (subscription.duration_type === "years") endDate.setFullYear(endDate.getFullYear() + subscription.duration_value);
    else throw new Error("Invalid subscription duration type");
    return endDate;
};

exports.createReference = async (req, res) => {
    try {
        const reference = String(req.body.reference || "").trim();
        const subscription_id = req.body.subscription_id;
        if (!reference || !subscription_id) return res.status(400).json({ message: "reference and subscription_id are required", error: true });
        if (!(await db.Subscription.findByPk(subscription_id))) return res.status(404).json({ message: "Subscription not found", error: true });
        const data = await db.Reference.create({ reference, subscription_id });
        res.status(201).json({ message: "Reference created successfully", data, error: false });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error", error: true });
    }
};

exports.getReferences = async (req, res) => {
    try {
        const data = await db.Reference.findAll({
            include: [
                { model: db.Subscription, as: "subscription" },
                { model: db.ReferenceUser, as: "users", include: [{ model: db.User, as: "user", attributes: { exclude: ["password"] } }] },
            ],
            order: [["createdAt", "DESC"]],
        });
        res.json({ message: "References fetched successfully", data, error: false });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error", error: true });
    }
};

exports.updateReference = async (req, res) => {
    try {
        const item = await db.Reference.findByPk(req.params.id);
        if (!item) return res.status(404).json({ message: "Reference not found", error: true });
        const { reference, subscription_id, is_active } = req.body;
        if (subscription_id && !(await db.Subscription.findByPk(subscription_id))) return res.status(404).json({ message: "Subscription not found", error: true });
        await item.update({
            ...(reference !== undefined && { reference: String(reference).trim() }),
            ...(subscription_id !== undefined && { subscription_id }),
            ...(is_active !== undefined && { is_active }),
        });
        res.json({ message: "Reference updated successfully", data: item, error: false });
    } catch (err) {
        res.status(500).json({ message: err.message || "Internal server error", error: true });
    }
};

exports.redeemReference = async (userId, referenceText, transaction) => {
    const reference = String(referenceText || "").trim();
    if (!reference) return null;
    const item = await db.Reference.findOne({ where: { reference, is_active: true }, transaction });
    if (!item) throw new Error("Invalid or inactive reference");
    if (await db.ReferenceUser.findOne({ where: { user_id: userId }, transaction })) throw new Error("A reference has already been used for this user");
    const subscription = await db.Subscription.findByPk(item.subscription_id, { transaction });
    if (!subscription || !subscription.is_active) throw new Error("Reference subscription is unavailable");

    const startDate = new Date();
    const endDate = calculateEndDate(subscription);
    const sessions = subscription.max_sessions;
    const payment = await db.Payment.create({
        user_id: userId, subscription_id: subscription.id, amount: 0, currency: subscription.currency,
        status: "completed", payment_method: "reference", transaction_id: `reference-${item.id}-${userId}`, paid_at: startDate,
    }, { transaction });
    const purchase = await db.PurchaseSubscription.create({
        user_id: userId, subscription_id: subscription.id, payment_reference: payment.id, amount_paid: 0,
        currency: subscription.currency, start_date: startDate, end_date: endDate, status: "active",
        sessions, remaining_sessions: sessions, raw_subscription: subscription.toJSON(),
    }, { transaction });
    await db.ReferenceUser.create({ reference_id: item.id, user_id: userId }, { transaction });
    const user = await db.User.findByPk(userId, { transaction });
    if (user) await user.update({ session_points: (user.session_points || 0) + (sessions || 0), expire_date: endDate }, { transaction });
    return purchase;
};
