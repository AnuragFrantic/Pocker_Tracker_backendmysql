const db = require("../models");
const Session = db.Sessions;
const GameTypes = db.GameTypes;
const PokerRoom = db.PokerRoom;
const Games = db.Games;
const User = db.User;
const PurchaseSubscription = db.PurchaseSubscription;
const UserGameHistory = db.UserGameHistory;
const GameHistory = db.GameHistory;





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

        let Totalamount = data.buy_in


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
            { ...data, user_id: userId, total_amount: Totalamount },
            { transaction: t }
        );


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











exports.updateSession = async (req, res) => {
    const t = await db.sequelize.transaction(); // transaction for safety
    try {
        const { id } = req.params;
        const updates = req.body;

        let session = await Session.findByPk(id, { transaction: t });
        if (!session) {
            await t.rollback();
            return res.status(404).json({ message: "Session not found", error: true });
        }




        let createGameHistory = false;

        let totalAmount =
            parseInt(session.total_amount || 0) +
            parseInt(session.re_buys || 0) +
            parseInt(updates.add_on_amount || 0);



        const re_buys = parseInt(updates.re_buys ?? session.re_buys ?? 0);

        const cash_out = parseInt(updates.cash_out ?? session.cash_out ?? 0);
        const dealer_tips = parseInt(updates.dealer_tips ?? session.dealer_tips ?? 0);
        const meals_other_exp = parseInt(updates.meals_other_exp ?? session.meals_other_exp ?? 0);




        session.re_buys = re_buys;
        session.cash_out = cash_out;
        session.dealer_tips = dealer_tips;
        session.meals_other_exp = meals_other_exp;

        session.total_amount = totalAmount + re_buys + dealer_tips + meals_other_exp;

        session.add_on_amount = parseInt(updates.add_on_amount || 0);
        session.profit_loss = cash_out - session.total_amount;

        await session.save({ transaction: t });


        if (createGameHistory) {


            await UserGameHistory.create({
                session_id: session.id,
                user_id: session.user_id,
                games_id: session.games_id,
                buy_in,
                re_buys,
                add_on_amount,
                cash_out,
                dealer_tips,
                meals_other_exp,
                profit_loss: session.profit_loss,
                notes: `Update adjustment for Session #${session.id}`
            }, { transaction: t });
        }

        await t.commit();

        res.status(200).json({
            message: "Session updated successfully",
            data: session,
            error: false
        });
    } catch (err) {
        await t.rollback();
        console.error("Update Session Error:", err);
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



// UserGameHistory = player-specific record (who spent/won how much).

// GameHistory = overall session summary (who won, duration, hands played).