const db = require("../models");
const Session = db.Sessions;
const GameTypes = db.GameTypes;
const SessionTypes = db.SessionTypes;

const PokerRoom = db.PokerRoom;
const Games = db.Games;
const User = db.User;
const PurchaseSubscription = db.PurchaseSubscription;
const UserGameHistory = db.UserGameHistory;
const { Sequelize } = require('../config/db');
const { Op } = require("sequelize");




exports.getAllSessions = async (req, res) => {
    try {
        let { page = 1, limit = 10, games_id, room_id } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const whereCondition = {};
        if (req.user.type === "user") {
            whereCondition.user_id = req.user.id;
        }

        // Game filter (ID or name)
        if (games_id) {
            const gameValues = games_id.split(",");
            const ids = gameValues.filter(v => /^\d+$/.test(v)).map(Number);
            const names = gameValues.filter(v => !/^\d+$/.test(v));

            whereCondition[Op.or] = [];
            if (ids.length) whereCondition[Op.or].push({ games_id: { [Op.in]: ids } });
            if (names.length) whereCondition[Op.or].push({ "$game.name$": { [Op.in]: names } });
        }

        // Room filter (ID or name)
        if (room_id) {
            const roomValues = room_id.split(",");
            const ids = roomValues.filter(v => /^\d+$/.test(v)).map(Number);
            const names = roomValues.filter(v => !/^\d+$/.test(v));

            if (!whereCondition[Op.or]) whereCondition[Op.or] = [];
            if (ids.length) whereCondition[Op.or].push({ room_id: { [Op.in]: ids } });
            if (names.length) whereCondition[Op.or].push({ "$room_name$": { [Op.in]: names } });
        }

        // Fetch sessions
        let { count, rows } = await Session.findAndCountAll({
            where: whereCondition,
            include: [
                { model: GameTypes, as: "game_type", required: false },
                { model: PokerRoom, as: "room", required: false },
                { model: SessionTypes, as: "session_type", required: false },
                { model: Games, as: "game", required: false },
                { model: User, as: "user", required: false }
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]]
        });

        // Calculate profit/loss based only on buy_in and cash_out
        const dataWithExtras = rows.map(session => {
            const s = session.toJSON();

            const buy_in = Number(s.buy_in) || 0;
            const cash_out = Number(s.cash_out) || 0;

            // ✅ Strict calculation: only cash_out - buy_in
            const profit_loss = cash_out - buy_in;

            // Location
            const location = s.room?.address || s.room_name || "N/A";

            // Profit/Loss status
            const result_type = profit_loss > 0 ? "Profit" : profit_loss < 0 ? "Loss" : "Break-even";

            return {
                ...s,
                buy_in,
                cash_out,
                profit_loss: Number(profit_loss.toFixed(2)),
                result_type,
                location
            };
        });



        res.status(200).json({
            data: dataWithExtras,
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
        console.error("Error in getAllSessions:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};












// exports.createSession = async (req, res) => {
//     const t = await db.sequelize.transaction(); // transaction for safety
//     try {
//         const data = req.body;
//         const userId = req.user.id;

//         // ✅ Check if user exists
//         const user = await db.User.findByPk(userId, { transaction: t });
//         if (!user) {
//             await t.rollback();
//             return res.status(404).json({ message: "User not found", error: true });
//         }

//         // ✅ Validate required fields
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

//         let Totalamount = data.buy_in


//         // ✅ Deduct from user free sessions if available
//         if (user.session_points && user.session_points > 0) {
//             user.session_points -= 1;
//             user.used_session_points = (user.used_session_points || 0) + 1;
//             await user.save({ transaction: t });
//             deductedFromUser = true;
//         }

//         // ✅ Check for active subscription
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

//         // ✅ If neither free sessions nor subscription found
//         if (!deductedFromUser && !deductedFromSubscription) {
//             await t.rollback();
//             return res.status(400).json({
//                 message: "No free sessions or active subscription available. Please buy a subscription.",
//                 error: true
//             });
//         }

//         // ✅ Create session
//         const newSession = await db.Sessions.create(
//             { ...data, user_id: userId, total_amount: Totalamount },
//             { transaction: t }
//         );


//         await db.UserGameHistory.create(
//             {
//                 session_id: newSession.id,
//                 user_id: userId,
//                 room_id: data.room_id,
//                 games_id: data.games_id,
//                 buy_in: data.buy_in || 0,
//                 re_buys: data.re_buys || 0,
//                 add_on_amount: data.add_on_amount || 0,
//                 cash_out: data.cash_out || 0,
//                 profit_loss:
//                     (data.cash_out || 0) -
//                     ((data.buy_in || 0) + (data.add_on_amount || 0) + (data.re_buys || 0)),
//                 notes: data.session_notes || null
//             },
//             { transaction: t }
//         );

//         await t.commit();
//         return res.status(201).json({
//             message: "Session created successfully",
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
//         res.status(500).json({ message: "Internal Server Error", error: true });
//     }
// };


exports.createSession = async (req, res) => {
    const t = await db.sequelize.transaction();
    try {
        const data = req.body;
        const userId = req.user.id;

        // ✅ Helper to safely convert to number, fallback to 0
        const toNumber = (val) => {
            if (val === undefined || val === null || val === "") return 0;
            return Number(val);
        };

        // Fetch user
        const user = await db.User.findByPk(userId, { transaction: t });
        if (!user) {
            await t.rollback();
            return res
                .status(404)
                .json({ message: "User not found", error: true });
        }

        // Validate required fields
        if (!data.session_type_id || !data.game_type_id || !data.games_id) {
            await t.rollback();
            return res.status(400).json({
                message: "Missing required session fields",
                error: true,
            });
        }

        let deductedFromUser = false;
        let deductedFromSubscription = false;

        // Deduct from user free sessions first
        if (user.session_points > 0) {
            user.session_points -= 1;
            user.used_session_points = (user.used_session_points || 0) + 1;
            await user.save({ transaction: t });
            deductedFromUser = true;
        } else {
            // Deduct from subscription
            const subscription = await db.PurchaseSubscription.findOne({
                where: {
                    user_id: userId,
                    status: "active",
                    // remaining_sessions: { [db.Sequelize.Op.gt]: 0 },
                    end_date: { [db.Sequelize.Op.gte]: new Date() },
                },
                order: [["end_date", "ASC"]],
                transaction: t,
            });

            if (subscription) {
                subscription.remaining_sessions -= 1;
                await subscription.save({ transaction: t });
                deductedFromSubscription = true;
            }

            if (!deductedFromSubscription) {
                await t.rollback();
                return res.status(400).json({
                    message:
                        "No free sessions or active subscription available. Please buy a subscription.",
                    error: true,
                });
            }
        }

        // ✅ Convert numeric/array fields into [{ amount: number }]
        const formatArray = (val) => {
            if (!val) return [];
            if (Array.isArray(val))
                return val.map((num) => ({ amount: toNumber(num) }));
            return [{ amount: toNumber(val) }];
        };

        const buyInArray = formatArray(data.buy_in);
        const reBuyArray = formatArray(data.re_buys);
        const addOnArray = formatArray(data.add_on_amount);
        const dealerTipsArray = formatArray(data.dealer_tips);
        const cashOutArray = formatArray(data.cash_out);


        // ✅ Calculate total add-ons, buy-ins, etc.
        const sumAmounts = (arr) =>
            Array.isArray(arr) ? arr.reduce((sum, obj) => sum + obj.amount, 0) : 0;

        const totalBuyIn = sumAmounts(buyInArray);
        const totalReBuy = sumAmounts(reBuyArray);
        const totalAddOn = sumAmounts(addOnArray);
        const totalDealerTips = sumAmounts(dealerTipsArray);
        const totalCashOut = sumAmounts(cashOutArray);


        const totalAmount =
            totalBuyIn +
            totalReBuy +
            totalAddOn +
            totalDealerTips +
            toNumber(data.meals_other_exp);

        // ✅ Create session payload
        const sessionPayload = {
            ...data,
            user_id: userId,
            buy_in: totalBuyIn,
            meals_other_exp: toNumber(data.meals_other_exp),
            add_on_amount: totalAddOn,
            re_buys: totalReBuy,
            dealer_tips: totalDealerTips,
            cash_out: totalCashOut,
            total_amount: totalAmount,
            stakes: toNumber(data.stakes),
        };

        // Create main session
        const newSession = await db.Sessions.create(sessionPayload, { transaction: t });

        // ✅ Create UserGameHistory (Single record with arrays of objects)
        await db.UserGameHistory.create({
            session_id: newSession.id,
            user_id: userId,
            room_id: data.room_id,
            games_id: data.games_id,
            buy_in: buyInArray,
            re_buys: reBuyArray,
            add_on_amount: addOnArray,
            dealer_tips: dealerTipsArray,
            meal_exp: data.meals_other_exp,
            cash_out: cashOutArray,
            profit_loss: totalCashOut - totalAmount,
            notes: data.session_notes || null,
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            message: "Session created successfully",
            data: {
                session: newSession,
                remaining_free_sessions: user.session_points,
                deducted_from: deductedFromUser
                    ? "user_points"
                    : "subscription",
            },
            error: false,
        });
    } catch (err) {
        await t.rollback();
        console.error("Create Session Error:", err);
        res
            .status(500)
            .json({ message: "Internal Server Error", error: true });
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

// exports.getUserGameAnalytics = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         // 🔹 Fetch all sessions for this user
//         const sessions = await db.Sessions.findAll({
//             where: { user_id: userId },
//             include: [
//                 {
//                     model: db.Games,
//                     as: "game",
//                     attributes: ["id", "name", "game_type_id"]
//                 }
//             ]
//         });

//         if (!sessions || sessions.length === 0) {
//             return res.status(200).json({
//                 data: [],
//                 message: "No sessions found for this user",
//                 error: false
//             });
//         }

//         // 🔹 Aggregate by game
//         const analytics = {};

//         sessions.forEach(session => {
//             if (!session.game) return; // skip if no game linked

//             const gameId = session.game.id;
//             const gameName = session.game.name;

//             if (!analytics[gameId]) {
//                 analytics[gameId] = {
//                     gameId,
//                     gameName,
//                     totalProfitLoss: 0,
//                     sessionsPlayed: 0
//                 };
//             }

//             const totalAmount = Number(session.total_amount) || 0;
//             const cashOut = Number(session.cash_out) || 0;
//             const profitLoss = cashOut - totalAmount;

//             analytics[gameId].totalProfitLoss += profitLoss;
//             analytics[gameId].sessionsPlayed += 1;
//         });

//         // 🔹 Convert to array and calculate profit per session
//         const result = Object.values(analytics).map(a => ({
//             gameId: a.gameId,
//             game: a.gameName,
//             profitLoss: Number(a.totalProfitLoss.toFixed(2)),
//             sessions: a.sessionsPlayed,
//             profitPerSession: Number((a.totalProfitLoss / (a.sessionsPlayed || 1)).toFixed(2))
//         }));

//         res.status(200).json({
//             data: result,
//             message: "User game analytics retrieved successfully",
//             error: false
//         });

//     } catch (err) {
//         console.error("Error in getUserGameAnalytics:", err);
//         res.status(500).json({ message: "Internal Server Error", error: true });
//     }
// };

exports.getUserGameAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // 🔹 Fetch all sessions for this user, including Game + GameType
        const sessions = await db.Sessions.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.Games,
                    as: "game",
                    attributes: ["id", "name", "game_type_id"],
                    include: [
                        {
                            model: db.GameTypes,
                            as: "game_type",
                            attributes: ["id", "name"]
                        }
                    ]
                }
            ]
        });

        if (!sessions || sessions.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No sessions found for this user",
                error: false
            });
        }

        // 🔹 Filter sessions where GameType = "Tournament"
        const tournamentSessions = sessions.filter(
            s => s.game && s.game.game_type && s.game.game_type.name === "Tournament"
        );

        if (tournamentSessions.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No Tournament sessions found for this user",
                error: false
            });
        }

        // 🔹 Aggregate by game
        const analytics = {};

        tournamentSessions.forEach(session => {
            const gameId = session.game.id;
            const gameName = session.game.name;
            const gameTypeName = session.game.game_type?.name || "Unknown";

            if (!analytics[gameId]) {
                analytics[gameId] = {
                    gameId,
                    gameName,
                    gameType: gameTypeName,
                    totalProfitLoss: 0,
                    sessionsPlayed: 0
                };
            }

            // ✅ Updated profit/loss calculation
            // Include only cash_out, buy_in, dealer_tips (and add_on, re_buys)
            const buyIn = Number(session.buy_in) || 0;
            const addOn = Number(session.add_on_amount) || 0;
            const reBuys = Number(session.re_buys) || 0;
            const dealerTips = Number(session.dealer_tips) || 0;
            const cashOut = Number(session.cash_out) || 0;

            const profitLoss = cashOut - (buyIn + addOn + reBuys + dealerTips);

            analytics[gameId].totalProfitLoss += profitLoss;
            analytics[gameId].sessionsPlayed += 1;
        });

        // 🔹 Convert to array
        const result = Object.values(analytics).map(a => ({
            gameId: a.gameId,
            game: a.gameName,
            gameType: a.gameType,
            profitLoss: Number(a.totalProfitLoss.toFixed(2)),
            sessions: a.sessionsPlayed,
            profitPerSession: Number((a.totalProfitLoss / (a.sessionsPlayed || 1)).toFixed(2))
        }));

        res.status(200).json({
            data: result,
            message: "Tournament analytics retrieved successfully",
            error: false
        });

    } catch (err) {
        console.error("Error in getUserGameAnalytics:", err);
        res.status(500).json({ message: "Internal Server Error", error: true });
    }
};



exports.getUserCashGameAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // 🔹 Fetch all sessions for this user, including Game + GameType
        const sessions = await db.Sessions.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.Games,
                    as: "game",
                    attributes: ["id", "name", "game_type_id"],
                    include: [
                        {
                            model: db.GameTypes,
                            as: "game_type",
                            attributes: ["id", "name"]
                        }
                    ]
                }
            ]
        });

        if (!sessions || sessions.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No sessions found for this user",
                error: false
            });
        }

        // 🔹 Filter sessions where GameType = "Cash Game"
        const cashGameSessions = sessions.filter(
            s => s.game && s.game.game_type && s.game.game_type.name === "Cash Game"
        );

        if (cashGameSessions.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No Cash Game sessions found for this user",
                error: false
            });
        }

        // 🔹 Aggregate by game
        const analytics = {};

        cashGameSessions.forEach(session => {
            const gameId = session.game.id;
            const gameName = session.game.name;
            const gameTypeName = session.game.game_type?.name || "Unknown";

            if (!analytics[gameId]) {
                analytics[gameId] = {
                    gameId,
                    gameName,
                    gameType: gameTypeName,
                    totalProfitLoss: 0,
                    sessionsPlayed: 0
                };
            }

            const totalAmount = Number(session.total_amount) || 0;
            const cashOut = Number(session.cash_out) || 0;
            const profitLoss = cashOut - totalAmount;

            analytics[gameId].totalProfitLoss += profitLoss;
            analytics[gameId].sessionsPlayed += 1;
        });

        // 🔹 Convert to array (simplified fields)
        const result = Object.values(analytics).map(a => ({
            game: a.gameName,
            sessions: a.sessionsPlayed,
            totalProfit: Number(a.totalProfitLoss.toFixed(2)),
            avgProfitPerSession: Number((a.totalProfitLoss / (a.sessionsPlayed || 1)).toFixed(2))
        }));

        res.status(200).json({
            data: result,
            message: "Cash Game analytics retrieved successfully",
            error: false
        });

    } catch (err) {
        console.error("Error in getUserCashGameAnalytics:", err);
        res.status(500).json({ message: "Internal Server Error", error: true });
    }
};









// in this profit and loss calcualte exclude meals and other exp

exports.getUserRoomAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all sessions for this user
        const sessions = await db.Sessions.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.PokerRoom,
                    as: "room",
                    attributes: ["id", "name"]
                },
                {
                    model: db.Games,
                    as: "game",
                    attributes: ["id", "name"]
                }
            ]
        });

        if (!sessions || sessions.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No sessions found for this user",
                error: false
            });
        }

        const analytics = {};

        sessions.forEach(session => {
            const key = session.room?.id
                ? `id_${session.room.id}`
                : session.room_name
                    ? `name_${session.room_name}`
                    : "unknown_room";

            const roomId = session.room?.id || null;
            const roomName = session.room?.name || session.room_name || "Unknown Room";

            // Extract numeric values safely
            const buyIn = Number(session.buy_in) || 0;
            const addOn = Number(session.add_on_amount) || 0; // kept for totals, not for profit/loss
            const reBuys = Number(session.re_buys) || 0;
            const dealerTips = Number(session.dealer_tips) || 0;
            const cashOut = Number(session.cash_out) || 0;

            // ✅ Updated profit/loss formula (exclude add_on_amount)
            const profitLoss = cashOut - (buyIn + reBuys + dealerTips);

            const gamesPlayed = session.game ? 1 : 0;

            if (!analytics[key]) {
                analytics[key] = {
                    roomId,
                    roomName,
                    totalProfitLoss: 0,
                    sessionsPlayed: 0,
                    gamesPlayed: 0,
                    totalBuyIn: 0,
                    totalAddOn: 0,
                    totalReBuys: 0,
                    totalDealerTips: 0,
                    totalCashOut: 0
                };
            }

            // Accumulate totals per room
            analytics[key].totalProfitLoss += profitLoss;
            analytics[key].sessionsPlayed += 1;
            analytics[key].gamesPlayed += gamesPlayed;
            analytics[key].totalBuyIn += buyIn;
            analytics[key].totalAddOn += addOn;
            analytics[key].totalReBuys += reBuys;
            analytics[key].totalDealerTips += dealerTips;
            analytics[key].totalCashOut += cashOut;
        });

        // Format output
        const result = Object.values(analytics).map(a => ({
            roomId: a.roomId,
            room: a.roomName,
            sessions: a.sessionsPlayed,
            gamesPlayed: a.gamesPlayed,
            totalBuyIn: Number(a.totalBuyIn.toFixed(2)),
            totalAddOn: Number(a.totalAddOn.toFixed(2)),
            totalReBuys: Number(a.totalReBuys.toFixed(2)),
            totalDealerTips: Number(a.totalDealerTips.toFixed(2)),
            totalCashOut: Number(a.totalCashOut.toFixed(2)),
            profitLoss: Number(a.totalProfitLoss.toFixed(2)),
            profitPerSession: Number((a.totalProfitLoss / (a.sessionsPlayed || 1)).toFixed(2))
        }));

        res.status(200).json({
            data: result,
            message: "User room analytics retrieved successfully",
            error: false
        });

    } catch (err) {
        console.error("Error in getUserRoomAnalytics:", err);
        res.status(500).json({ message: "Internal Server Error", error: true });
    }
};






// UserGameHistory = player-specific record (who spent/won how much).

// GameHistory = overall session summary (who won, duration, hands played).