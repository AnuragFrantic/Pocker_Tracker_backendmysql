const db = require("../models");
const UserGameHistory = db.UserGameHistory;
const Games = db.Games;
const Sessions = db.Sessions
const PokerRoom = db.PokerRoom


const { Op } = require("sequelize");



exports.getallGameHistory = async (req, res) => {
    const userid = req.user.id;
    const sessionid = req.query.session || req.query["session"];
    let whereCondition = {};
    const type = req.user.type

    if (type === "user") {
        // User can see only their own history
        whereCondition.user_id = userid;
    }

    if (sessionid) {
        whereCondition.session_id = sessionid;
    }

    try {
        const data = await UserGameHistory.findAll({
            where: whereCondition,
            include: [
                {
                    model: Games,
                    as: "games",
                    attributes: ["id", "name", "game_type_id"],
                },
            ],
        });

        // Parse JSON fields before sending
        const parsedData = data.map((item) => {
            const jsonFields = [
                "buy_in",
                "re_buys",
                "add_on_amount",
                "dealer_tips",
                "cash_out",
            ];

            const parsedItem = item.toJSON();

            jsonFields.forEach((field) => {
                try {
                    parsedItem[field] = parsedItem[field]
                        ? JSON.parse(parsedItem[field])
                        : [];
                } catch {
                    parsedItem[field] = [];
                }
            });

            return parsedItem;
        });

        res.json({
            data: parsedData,
            message: "Game History retrieved successfully",
            error: false,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, error: true });
    }
};





exports.getFormattedGameHistory = async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.query.session || req.query["session"];
    const whereCondition = { user_id: userId };

    if (sessionId) {
        whereCondition.session_id = sessionId;
    }

    try {
        const histories = await UserGameHistory.findAll({
            where: whereCondition,
            include: [
                {
                    model: Games,
                    as: "games",
                    attributes: ["id", "name"]
                },
                {
                    model: Sessions,
                    as: "session",
                    attributes: ["id", "room_id", "createdAt", "session_notes", "stakes"],
                    include: [
                        {
                            model: PokerRoom,
                            as: "room",
                            attributes: ["id", "name"]
                        }
                    ]
                }
            ],
            order: [["createdAt", "ASC"]]
        });

        // 🔹 Group by session
        const grouped = {};

        histories.forEach((record) => {
            const s = record.session;
            if (!s) return;

            if (!grouped[s.id]) {
                grouped[s.id] = {
                    sessionId: s.id,
                    roomName: s.room ? s.room.name : "Home Game",
                    date: new Date(s.createdAt).toLocaleDateString("en-US"),
                    addOns: [],
                    totalProfitLoss: 0,
                    stakes: s.stakes || "-",
                    notes: s.session_notes || "",
                    game: record.games ? record.games.name : "-",
                };
            }

            // 🔸 Safely parse JSON fields
            const parseArray = (val) => {
                if (!val) return [];
                try {
                    return Array.isArray(val) ? val : JSON.parse(val);
                } catch {
                    return [];
                }
            };

            const buyIn = parseArray(record.buy_in);
            const rebuys = parseArray(record.re_buys);
            const addOns = parseArray(record.add_on_amount);
            const dealerTips = parseArray(record.dealer_tips);
            const cashOut = parseArray(record.cash_out);
            const mealsExp = Number(record.meals_other_exp || 0);

            // 🔸 Compute totals
            const totalBuyIn = buyIn.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalRebuys = rebuys.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalAddOns = addOns.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalDealerTips = dealerTips.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalCashOut = cashOut.reduce((sum, x) => sum + (x.amount || 0), 0);

            grouped[s.id].addOns.push(...addOns);
            const totalSpent = totalBuyIn + totalRebuys + totalAddOns + totalDealerTips + mealsExp;
            const profitLoss = totalCashOut - totalSpent;
            grouped[s.id].totalProfitLoss += profitLoss;
        });

        // 🔹 Format output
        const result = Object.values(grouped).map((s) => ({
            room: s.roomName,
            date: s.date,
            addOns: s.addOns.length > 0 ? s.addOns : [],
            profitLoss: `$${s.totalProfitLoss.toFixed(2)}`,
            stakes: s.stakes,
            game: s.game,
            notes: s.notes,
        }));

        res.json({
            data: result,
            message: "Formatted game history retrieved successfully",
            error: false,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, error: true });
    }
};






exports.annualreport = async (req, res) => {
    try {
        const userId = req.user.id;
        const year = req.query.year || 2025;

        const histories = await UserGameHistory.findAll({
            where: {
                user_id: userId,
                createdAt: {
                    [Op.between]: [
                        new Date(`${year}-01-01T00:00:00.000Z`),
                        new Date(`${year}-12-31T23:59:59.999Z`),
                    ],
                },
            },
            include: [
                {
                    model: Games,
                    as: "games",
                    attributes: ["id", "name", "game_type_id"],
                },
            ],
        });

        if (!histories.length) {
            return res.status(200).json({
                message: `No game history found for year ${year}`,
                data: {
                    totalBuyIns: 0,
                    totalReBuys: 0,
                    totalAddOns: 0,
                    dealerTips: 0,
                    mealsAndOthers: 0,
                    totalExpenditure: 0,
                    totalIncome: 0,
                    netProfitLoss: 0,
                    totalSessions: 0,
                },
                error: false,
            });
        }

        const sumAmounts = (arr) => {
            if (!arr) return 0;
            if (Array.isArray(arr)) {
                return arr.reduce((a, c) => a + (c?.amount || 0), 0);
            }
            if (typeof arr === "object" && arr.amount) return arr.amount;
            if (typeof arr === "number") return arr;
            return 0;
        };

        let totalBuyIns = 0;
        let totalReBuys = 0;
        let totalAddOns = 0;
        let dealerTips = 0;
        let totalCashOut = 0;
        let mealsAndOthers = 0;
        let profitLoss = 0;

        histories.forEach((item) => {
            totalBuyIns += sumAmounts(item.buy_in);
            totalReBuys += sumAmounts(item.re_buys);
            totalAddOns += sumAmounts(item.add_on_amount);
            dealerTips += sumAmounts(item.dealer_tips);
            totalCashOut += sumAmounts(item.cash_out);
            profitLoss += item.profit_loss || 0;

            // ✅ include meal_exp (numeric)
            mealsAndOthers += item.meal_exp ? Number(item.meal_exp) : 0;
        });

        const totalExpenditure =
            totalBuyIns + totalReBuys + totalAddOns + dealerTips + mealsAndOthers;
        const totalIncome = totalCashOut;
        const netProfitLoss = totalIncome - totalExpenditure;

        res.status(200).json({
            message: `Annual Report for ${year}`,
            data: {
                totalBuyIns,
                totalReBuys,
                totalAddOns,
                dealerTips,
                mealsAndOthers,
                totalExpenditure,
                totalIncome,
                netProfitLoss,
                totalSessions: histories.length,
                profitLoss,
            },
            error: false,
        });
    } catch (error) {
        console.error("Annual Report Error:", error);
        res.status(500).json({
            message: "Error generating annual report",
            error: true,
            details: error.message,
        });
    }
};

