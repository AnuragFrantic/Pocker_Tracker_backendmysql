const db = require("../models");
const UserGameHistory = db.UserGameHistory;
const Games = db.Games;
const Sessions = db.Sessions
const PokerRoom = db.PokerRoom






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

