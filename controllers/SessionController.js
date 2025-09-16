const db = require("../models");
const Session = db.Sessions;
const GameTypes = db.GameTypes;
const PokerRoom = db.PokerRoom;
const Games = db.Games;
const User = db.User;
const PurchaseSubscription = db.PurchaseSubscription;





exports.getAllSessions = async (req, res) => {
    try {
        // 🔹 Extract pagination params from query (default: page=1, limit=10)
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const offset = (page - 1) * limit;

        // 🔹 Fetch data with pagination
        let { count, rows } = await Session.findAndCountAll({
            include: [
                { model: GameTypes, as: "game_type", required: false },
                { model: PokerRoom, as: "room", required: false },
                { model: Games, as: "game", required: false },
                { model: User, as: "user", required: false }
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]] // optional: sort by latest
        });

        // ✅ Parse add_amount_history for each session
        rows = rows.map(session => {
            const json = session.toJSON();
            if (typeof json.add_amount_history === "string") {
                try {
                    json.add_amount_history = JSON.parse(json.add_amount_history);
                } catch (e) {
                    json.add_amount_history = [];
                }
            }
            return json;
        });

        res.status(200).json({
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            },
            message: "Sessions retrieved successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};


// exports.createSession = async (req, res) => {
//     try {
//         const data = req.body;
//         const id = req.user.id; 

//         // Check if user exists
//         let user = await User.findByPk(id);
//         if (!user) {
//             return res.status(404).json({ message: "User Not Found", error: true });
//         }

//         // Check if user has enough session points
//         if (!user.session_points || user.session_points <= 0) {
//             return res.status(200).json({
//                 message: "Insufficient session points. Please recharge your account.",
//                 error: true
//             });
//         }

//         // Validate required fields
//         if (!data.session_type_id) {
//             return res.status(200).json({ message: "Session type ID is required", error: true });
//         }
//         if (!data.game_type_id) {
//             return res.status(200).json({ message: "Game type ID is required", error: true });
//         }

//         // Deduct 1 session point
//         user.session_points = user.session_points - 1;
//         await user.save();



//         // Create session and link with user
//         const newSession = await Session.create({
//             ...data,
//             user_id: id // make sure Session has user_id FK
//         });

//         res.status(201).json({
//             message: "Session created successfully & 1 point deducted",
//             data: {
//                 session: newSession,
//                 remaining_points: user.session_points
//             },
//             error: false
//         });
//     } catch (err) {
//         console.error("❌ Create Session Error:", err);
//         res.status(500).json({ message: err.message, error: true });
//     }
// };


exports.createSession = async (req, res) => {
    const t = await db.sequelize.transaction(); // ✅ transaction for safety
    try {
        const data = req.body;
        const userId = req.user.id;

        // ✅ Check if user exists
        let user = await User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "User Not Found", error: true });
        }

        // ✅ Validate required fields
        if (!data.session_type_id) {
            await t.rollback();
            return res.status(400).json({ message: "Session type ID is required", error: true });
        }
        if (!data.game_type_id) {
            await t.rollback();
            return res.status(400).json({ message: "Game type ID is required", error: true });
        }

        let deductedFromUser = false;
        let deductedFromSubscription = false;

        // ✅ Deduct from user free sessions if available
        if (user.session_points && user.session_points > 0) {
            user.session_points -= 1;
            user.used_session_points = (user.used_session_points || 0) + 1;
            await user.save({ transaction: t });
            deductedFromUser = true;
        }

        // ✅ Check for active subscription
        let subscription = await PurchaseSubscription.findOne({
            where: {
                user_id: userId,
                status: "active",
                remaining_sessions: { [db.Sequelize.Op.gt]: 0 }
            },
            order: [["end_date", "ASC"]],
            transaction: t
        });

        if (subscription) {
            subscription.remaining_sessions -= 1;
            await subscription.save({ transaction: t });
            deductedFromSubscription = true;
        }

        // ❌ If neither free sessions nor subscription found
        if (!deductedFromUser && !deductedFromSubscription) {
            await t.rollback();
            return res.status(400).json({
                message: "No free sessions or active subscription available. Please buy a subscription.",
                error: true
            });
        }

        // ✅ Create session
        const newSession = await Session.create(
            { ...data, user_id: userId },
            { transaction: t }
        );

        await t.commit();
        return res.status(201).json({
            message: "✅ Session created successfully.",
            data: {
                session: newSession,
                remaining_free_sessions: user.session_points,
                subscription_remaining: subscription ? subscription.remaining_sessions : null,
                deducted_from: {
                    user_points: deductedFromUser,
                    subscription: deductedFromSubscription
                }
            },
            error: false
        });

    } catch (err) {
        await t.rollback();
        console.error("❌ Create Session Error:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};











exports.updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let session = await Session.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found", error: true });
        }

        // ✅ Always use array for history
        let history = Array.isArray(session.add_amount_history)
            ? session.add_amount_history
            : [];

        const amountFields = ["buy_in", "add_on_amount", "re_buys", "total_amount", "dealer_tips", "cash_out"];

        amountFields.forEach(field => {
            if (updates[field] !== undefined) {
                let oldVal = session[field];

                // Special case: accumulate add_on_amount
                if (field === "add_on_amount") {
                    const addedVal = Number(updates[field]);
                    const newVal = oldVal + addedVal;

                    history.push({
                        field,
                        old_value: oldVal,
                        added_value: addedVal,
                        new_value: newVal,
                        updated_at: new Date()
                    });

                    session[field] = newVal;
                } else if (updates[field] !== oldVal) {
                    history.push({
                        field,
                        old_value: oldVal,
                        new_value: updates[field],
                        updated_at: new Date()
                    });

                    session[field] = updates[field];
                }
            }
        });

        session.add_amount_history = history;

        await session.save();

        res.status(200).json({
            message: "Session updated successfully",
            data: session,
            error: false
        });
    } catch (err) {
        console.error("❌ Update Session Error:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};







exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found", error: true });
        }

        await session.destroy();

        res.status(200).json({
            message: "Session deleted successfully",
            error: false
        });
    } catch (err) {
        console.error("❌ Delete Session Error:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};
