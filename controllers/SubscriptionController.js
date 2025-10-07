const db = require("../models");
const Subscription = db.Subscription;



// CREATE
exports.CreateSubscription = async (req, res) => {
    try {
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }



        const newSubscription = await Subscription.create({
            ...req.body,
            image: imagePath
        });

        res.status(201).json({
            message: "Subscription created successfully",
            data: newSubscription,
            error: false
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true
        });
    }
};

// READ ALL
exports.GetAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.findAll();
        res.status(200).json({
            message: "Subscriptions fetched successfully",
            data: subscriptions,
            error: false
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true
        });
    }
};

// READ ONE
exports.GetSubscriptionById = async (req, res) => {
    try {
        const subscription = await Subscription.findByPk(req.params.id);
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found", error: true });
        }
        res.status(200).json({
            message: "Subscription fetched successfully",
            data: subscription,
            error: false
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true
        });
    }
};

// UPDATE
exports.UpdateSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findByPk(req.params.id);
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found", error: true });
        }

        let imagePath = subscription.image; // keep old image if not updating
        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        await subscription.update({
            ...req.body,
            image: imagePath
        });

        res.status(200).json({
            message: "Subscription updated successfully",
            data: subscription,
            error: false
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true
        });
    }
};

// DELETE
exports.ToggleSubscriptionStatus = async (req, res) => {
    try {
        const subscription = await Subscription.findByPk(req.params.id);
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found", error: true });
        }

        // Toggle the status
        subscription.is_active = !subscription.is_active;
        await subscription.save();

        res.status(200).json({
            message: `Subscription ${subscription.is_active ? "activated" : "deactivated"} successfully`,
            error: false,
            data: subscription
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true
        });
    }
};







// const deleteSelectedSubscriptions = async () => {
//     try {
//         const idsToDelete = [3, 6, 9];

//         const deletedCount = await Subscription.destroy({
//             where: { id: idsToDelete }
//         });

//         console.log(`Deleted ${deletedCount} subscriptions successfully`);
//     } catch (err) {
//         console.error("Error deleting subscriptions:", err.message);
//     }
// };

// // Run it directly
// deleteSelectedSubscriptions();