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

        //  Parse add_amount_history for each session
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


// old code


// exports.createSession = async (req, res) => {
//     const t = await db.sequelize.transaction(); //  transaction for safety
//     try {
//         const data = req.body;
//         const userId = req.user.id;

//         //  Check if user exists
//         let user = await User.findByPk(userId, { transaction: t });
//         if (!user) {
//             await t.rollback();
//             return res.status(404).json({ message: "User Not Found", error: true });
//         }

//         //  Validate required fields
//         if (!data.session_type_id) {
//             await t.rollback();
//             return res.status(400).json({ message: "Session type ID is required", error: true });
//         }
//         if (!data.game_type_id) {
//             await t.rollback();
//             return res.status(400).json({ message: "Game type ID is required", error: true });
//         }

//         let deductedFromUser = false;
//         let deductedFromSubscription = false;

//         //   Deduct from user free sessions if available
//         if (user.session_points && user.session_points > 0) {
//             user.session_points -= 1;
//             user.used_session_points = (user.used_session_points || 0) + 1;
//             await user.save({ transaction: t });
//             deductedFromUser = true;
//         }

//         //  Check for active subscription
//         let subscription = await PurchaseSubscription.findOne({
//             where: {
//                 user_id: userId,
//                 status: "active",
//                 remaining_sessions: { [db.Sequelize.Op.gt]: 0 }
//             },
//             order: [["end_date", "ASC"]],
//             transaction: t
//         });

//         if (subscription) {
//             subscription.remaining_sessions -= 1;
//             await subscription.save({ transaction: t });
//             deductedFromSubscription = true;
//         }

//         //  If neither free sessions nor subscription found
//         if (!deductedFromUser && !deductedFromSubscription) {
//             await t.rollback();
//             return res.status(400).json({
//                 message: "No free sessions or active subscription available. Please buy a subscription.",
//                 error: true
//             });
//         }

//         //  Create session
//         const newSession = await Session.create(
//             { ...data, user_id: userId },
//             { transaction: t }
//         );

//         await t.commit();
//         return res.status(201).json({
//             message: " Session created successfully.",
//             data: {
//                 session: newSession,
//                 remaining_free_sessions: user.session_points,
//                 subscription_remaining: subscription ? subscription.remaining_sessions : null,
//                 deducted_from: {
//                     user_points: deductedFromUser,
//                     subscription: deductedFromSubscription
//                 }
//             },
//             error: false
//         });

//     } catch (err) {
//         await t.rollback();
//         console.error(" Create Session Error:", err);
//         res.status(500).json({ message: err.message, error: true });
//     }
// };



exports.createSession = async (req, res) => {
    const t = await db.sequelize.transaction(); // transaction for safety
    try {
        const data = req.body;
        const userId = req.user.id;

        // ✅ Check if user exists
        const user = await db.User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: "User not found", error: true });
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
        let subscription = await db.PurchaseSubscription.findOne({
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

        // ✅ If neither free sessions nor subscription found
        if (!deductedFromUser && !deductedFromSubscription) {
            await t.rollback();
            return res.status(400).json({
                message: "No free sessions or active subscription available. Please buy a subscription.",
                error: true
            });
        }

        // ✅ Create session
        const newSession = await db.Sessions.create(
            { ...data, user_id: userId },
            { transaction: t }
        );

        // (Optional) also create a UserGameHistory entry for the session creator
        await db.UserGameHistory.create(
            {
                session_id: newSession.id,
                user_id: userId,
                room_id: data.room_id,
                games_id: data.games_id,
                buy_in: data.buy_in || 0,
                re_buys: data.re_buys || 0,
                add_on_amount: data.add_on_amount || 0,
                cash_out: data.cash_out || 0,
                profit_loss:
                    (data.cash_out || 0) -
                    ((data.buy_in || 0) + (data.add_on_amount || 0) + (data.re_buys || 0)),
                notes: data.session_notes || null
            },
            { transaction: t }
        );

        await t.commit();
        return res.status(201).json({
            message: "Session created successfully",
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
        res.status(500).json({ message: "Internal Server Error", error: true });
    }
};


// POST /sessions/:sessionId/game-history
exports.addGameHistory = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const { sessionId } = req.params;
        const { game_id, hands_played, duration_minutes, winner_user_id, remarks } = req.body;

        // ✅ Check if session exists
        const session = await db.Sessions.findByPk(sessionId, { transaction: t });
        if (!session) {
            await t.rollback();
            return res.status(404).json({ message: "Session not found", error: true });
        }

        // ✅ Create GameHistory
        const gameHistory = await db.GameHistory.create({
            session_id: sessionId,
            game_id,
            hands_played,
            duration_minutes,
            winner_user_id,
            remarks
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({ message: "Game history added", data: gameHistory, error: false });
    } catch (err) {
        await t.rollback();
        console.error("Add GameHistory Error:", err);
        res.status(500).json({ message: "Internal Server Error", error: true });
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

        //  Always use array for history
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
        console.error(" Update Session Error:", err);
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
        console.error(" Delete Session Error:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};
