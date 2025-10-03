


const db = require("../models");



const User = db.User;
const Session = db.Sessions;
const UserGameHistory = db.UserGameHistory;
const PurchaseSubscription = db.PurchaseSubscription;
const Games = db.Games;
const GamesType = db.GameTypes;
const SessionTypes = db.SessionTypes;
const PokerRoom = db.PokerRoom;










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


exports.getUserProfile = async (req, res) => {
    try {
        let id = req.params.id;

        let user = await User.findByPk(id, {
            include: [
                // 🟢 Sessions
                {
                    model: Session,
                    as: "sessions",
                    attributes: ["id", "game_type_id", "buy_in", "cash_out", "createdAt", "total_amount", "session_type_id", "room_id", "games_id"],
                    include: [
                        {
                            model: Games,
                            as: "game",
                            attributes: ["id", "game_type_id", "name"]
                        },
                        {
                            model: GamesType,
                            as: "game_type",
                            attributes: ["id", "name"]
                        },
                        {
                            model: SessionTypes,
                            as: "session_type",
                            attributes: ["id", "name"]
                        },
                        {
                            model: PokerRoom,
                            as: "room",
                            attributes: ["id", "name"]
                        },

                    ]

                },






                // 🟢 User Game Histories
                {
                    model: UserGameHistory,
                    as: "game_histories",
                    include: [
                        {
                            model: Session,
                            as: "session",
                            attributes: ["id", "game_type_id", "buy_in", "cash_out", "total_amount"]
                        },
                        {
                            model: Games,
                            as: "games",
                            attributes: ["id", "game_type_id", "name"]
                        }
                    ]
                },

                // 🟢 Subscriptions
                {
                    model: PurchaseSubscription,
                    as: "subscriptions",
                    attributes: [
                        "id",
                        "status",
                        "remaining_sessions",
                        "start_date",
                        "end_date",
                        "amount_paid",
                        "currency"
                    ],
                    include: [
                        {
                            model: db.Subscription,
                            as: "subscription",
                            attributes: [
                                "id",
                                "name",
                                "description",
                                "mrp",
                                "price",
                                "currency",
                                "duration_value",
                                "duration_type",
                                "max_sessions",
                                "image",
                                "is_active"
                            ]
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        // 🟢 Calculate stats
        const total_sessions_created = user.sessions?.length || 0;
        const total_games_played = user.game_histories?.length || 0;

        // Profit/Loss = sum(cash_out - buy_in) for all sessions
        let total_profit_loss = 0;

        if (user.sessions && user.sessions.length > 0) {
            user.sessions.forEach(sess => {
                const totalAmount = parseFloat(sess.total_amount) || 0;
                const cash_out = parseFloat(sess.cash_out) || 0;
                total_profit_loss += (cash_out - totalAmount);
            });
        }

        // 🟢 Add profit status
        const profit_status = total_profit_loss >= 0;

        res.status(200).json({
            message: "User profile fetched successfully",
            data: user,
            stats: {
                total_sessions_created,
                total_games_played,
                total_profit_loss,
                profit: profit_status
            },
            error: false
        });

    } catch (err) {
        console.error("getUserProfile Error:", err);
        res.status(500).json({ message: "Internal server error", error: true });
    }
};



exports.updateUserProfile = async (req, res) => {
    try {
        // 🔹 Use body.id if passed, otherwise authenticated user's id
        const userId = req.body.id || req.user.id;

        // Remove id from updateData to avoid overriding primary key
        const { id, ...updateData } = req.body;

        // 🔹 Update user data
        const [updated] = await User.update(updateData, {
            where: { id: userId }
        });

        if (!updated) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        // 🔹 Fetch updated user profile
        const updatedUser = await User.findByPk(userId, {
            attributes: ["id", "first_name", "last_name", "email", "phone", "address", "city", "state", "zipcode", "image"]
        });

        res.status(200).json({
            message: "User profile updated successfully",
            data: updatedUser,
            error: false
        });

    } catch (err) {
        console.error("updateUserProfile Error:", err);
        res.status(500).json({ message: "Internal server error", error: true });
    }
};
