


const db = require("../models")

const User = db.User;
const Session = db.Sessions;
const UserGameHistory = db.UserGameHistory;
const PurchaseSubscription = db.PurchaseSubscription;





exports.getAllUSers = async (req, res) => {
    try {
        let data = await User.findAll();
        res.status(200).json({ message: "All Users fetch Successfully ", data, error: false })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: true })
    }
}

exports.getProfile = async (req, res) => {
    try {
        let id = req.user.id;
        let user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }
        res.status(200).json({ message: "User profile fetched successfully", data: user, error: false });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: true });
    }
}


// exports.getUserProfile = async (req, res) => {
//     try {
//         let id = req.params.id;

//         let user = await User.findByPk(id, {
//             include: [
//                 // 🟢 Sessions
//                 {
//                     model: Session,
//                     as: "sessions", // ✅ matches db.User.hasMany(db.Sessions, { as: "sessions" })
//                     attributes: ["id", "game_type_id", "buy_in", "cash_out", "createdAt"],
//                     include: [
//                         {
//                             model: db.GameHistory,
//                             as: "game_history", // ✅ from db.Sessions.hasOne(db.GameHistory, { as: "game_history" })
//                             attributes: ["id", "final_pot", "winner", "ended_at"]
//                         }
//                     ]
//                 },

//                 // 🟢 User Game Histories
//                 {
//                     model: UserGameHistory,
//                     as: "game_histories", // ✅ matches db.User.hasMany(UserGameHistory, { as: "game_histories" })
//                     include: [
//                         {
//                             model: Session,
//                             as: "session", // ✅ from db.UserGameHistory.belongsTo(db.Sessions, { as: "session" })
//                             attributes: ["id", "game_type_id", "buy_in", "cash_out"]
//                         }
//                     ]
//                 },

//                 // 🟢 Subscriptions
//                 {
//                     model: PurchaseSubscription,
//                     as: "subscriptions", // ✅ matches db.User.hasMany(PurchaseSubscription, { as: "subscriptions" })
//                     attributes: ["id", "status", "remaining_sessions", "start_date", "end_date"],
//                     include: [
//                         {
//                             model: db.Subscription,
//                             as: "subscription", // ✅ from db.PurchaseSubscription.belongsTo(db.Subscription, { as: "subscription" })
//                             attributes: ["id", "plan_name", "price", "duration"]
//                         }
//                     ]
//                 }
//             ]
//         });

//         if (!user) {
//             return res.status(404).json({ message: "User not found", error: true });
//         }

//         res.status(200).json({
//             message: "User profile fetched successfully",
//             data: user,
//             error: false
//         });

//     } catch (err) {
//         console.error("getUserProfile Error:", err);
//         res.status(500).json({ message: "Internal server error", error: true });
//     }
// };
