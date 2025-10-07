const db = require("../models");
const PurchaseSubscription = db.PurchaseSubscription;
const Subscription = db.Subscription;
const User = db.User;
const Payment = db.Payment;
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


// exports.CreatePurchaseSubscription = async (req, res) => {
//     const t = await db.sequelize.transaction();
//     try {
//         const { subscription_id, amount_paid, currency, payment_method, transaction_id, provider_response } = req.body;
//         const user_id = req.user.id;

//         // 1. Find subscription
//         const subscription = await Subscription.findByPk(subscription_id);
//         if (!subscription) {
//             return res.status(404).json({ message: "Subscription not found", error: true });
//         }

//         // 2. Calculate dates
//         const startDate = new Date();
//         const endDate = new Date();
//         // endDate.setDate(startDate.getDate() + subscription.duration_days);
//         if (subscription.duration_type === "days") {
//             endDate.setDate(startDate.getDate() + subscription.duration_value);
//         } else if (subscription.duration_type === "months") {
//             endDate.setMonth(startDate.getMonth() + subscription.duration_value);
//         } else if (subscription.duration_type === "years") {
//             endDate.setFullYear(startDate.getFullYear() + subscription.duration_value);
//         } else {
//             throw new Error("Invalid duration type");
//         }

//         // 3. Sessions
//         const sessions = subscription.max_sessions || null;
//         const remainingSessions = subscription.max_sessions || null;

//         // 4. Create Payment first
//         const newPayment = await Payment.create({
//             user_id,
//             subscription_id,
//             amount: amount_paid,
//             currency: currency || subscription.currency,
//             status: "completed", // you can set "pending" until gateway confirms
//             payment_method: payment_method || "manual", // fallback
//             transaction_id,
//             provider_response,
//             paid_at: new Date()
//         }, { transaction: t });

//         // 5. Create purchase and link payment_reference
//         const newPurchase = await PurchaseSubscription.create({
//             user_id,
//             subscription_id,
//             payment_reference: newPayment.id, // 👈 link payment
//             amount_paid,
//             currency: currency || subscription.currency,
//             start_date: startDate,
//             end_date: endDate,
//             status: "active",
//             sessions,
//             remaining_sessions: remainingSessions,
//             raw_subscription: subscription.toJSON()
//         }, { transaction: t });

//         // 6. Update user session points
//         const user = await User.findByPk(user_id);
//         if (user) {
//             user.session_points = (user.session_points || 0) + sessions;
//             user.expire_date = endDate;
//             await user.save({ transaction: t });
//         }

//         // 7. Commit transaction
//         await t.commit();

//         res.status(201).json({
//             message: "Purchase Subscription created successfully",
//             data: {
//                 purchase: newPurchase,
//                 payment: newPayment
//             },
//             error: false,
//         });

//     } catch (err) {
//         await t.rollback(); // rollback if error
//         res.status(500).json({
//             message: err.message || "Internal server error",
//             error: true,
//         });
//     }
// };




exports.CreateStripeCheckoutSession = async (req, res) => {
    try {
        const { subscription_id } = req.body;
        const user_id = req.user.id;

        // 1. Find subscription
        const subscription = await Subscription.findByPk(subscription_id);
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found", error: true });
        }

        // 2. Create Stripe checkout session


        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment", // or "subscription" if recurring
            customer_email: req.user.email,
            line_items: [
                {
                    price_data: {
                        currency: subscription.currency || "usd",
                        product_data: {
                            name: subscription.name,
                            description: subscription.description || "Subscription plan",
                        },
                        unit_amount: Math.round(subscription.price * 100), // in cents
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                user_id,
                subscription_id,
            },
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
        });

        res.status(200).json({
            message: "Stripe checkout session created",
            sessionId: session.id,
            checkout_url: session.url,
            error: false,
        });

    } catch (err) {
        console.error("Stripe Checkout error:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};




exports.StripeWebhookHandler = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, // ⚠ must be raw
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );


    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const { user_id, subscription_id } = session.metadata;

        const t = await db.sequelize.transaction();
        try {
            const subscription = await Subscription.findByPk(subscription_id);

            // Calculate start & end date
            const startDate = new Date();
            const endDate = new Date();
            if (subscription.duration_type === "days") {
                endDate.setDate(startDate.getDate() + subscription.duration_value);
            } else if (subscription.duration_type === "months") {
                endDate.setMonth(startDate.getMonth() + subscription.duration_value);
            } else if (subscription.duration_type === "years") {
                endDate.setFullYear(startDate.getFullYear() + subscription.duration_value);
            }

            const sessions = subscription.max_sessions || null;

            // Create Payment
            const newPayment = await Payment.create({
                user_id,
                subscription_id,
                amount: session.amount_total / 100,
                currency: session.currency,
                status: "completed",
                payment_method: "stripe",
                transaction_id: session.payment_intent,
                provider_response: JSON.stringify(session),
                paid_at: new Date(),
            }, { transaction: t });

            // Create Purchase Subscription
            const newPurchase = await PurchaseSubscription.create({
                user_id,
                subscription_id,
                payment_reference: newPayment.id,
                amount_paid: session.amount_total / 100,
                currency: session.currency,
                start_date: startDate,
                end_date: endDate,
                status: "active",
                sessions,
                remaining_sessions: sessions,
                raw_subscription: subscription.toJSON(),
            }, { transaction: t });

            // Update user
            const user = await User.findByPk(user_id);
            if (user) {
                user.session_points = (user.session_points || 0) + sessions;
                user.expire_date = endDate;
                await user.save({ transaction: t });
            }

            await t.commit();
            console.log("✅ Subscription purchase recorded for user", user_id);
        } catch (err) {
            await t.rollback();
            console.error("❌ Webhook error:", err);
        }
    }

    res.json({ received: true });
};





// READ ALL
exports.GetAllPurchaseSubscriptions = async (req, res) => {
    try {
        const purchases = await PurchaseSubscription.findAll({
            include: [
                { model: db.User, as: "user" },
                { model: db.Subscription, as: "subscription" },
                { model: db.Payment, as: "payment" }
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


exports.GetOwnPurchaseSubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;

        const purchases = await PurchaseSubscription.findAll({
            where: { user_id: userId },   //  filter by logged-in user
            include: [
                { model: db.User, as: "user" },
                { model: db.Subscription, as: "subscription" },
                { model: db.Payment, as: "payment" }
            ],
            order: [["createdAt", "DESC"]] // optional: latest first
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




