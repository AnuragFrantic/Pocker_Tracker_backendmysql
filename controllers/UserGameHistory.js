const db = require("../models");
const UserGameHistory = db.UserGameHistory;
const Games = db.Games;
const Sessions = db.Sessions
const PokerRoom = db.PokerRoom






exports.getallGameHistory = async (req, res) => {
    const userid = req.user.id
    const sessionid = req.query.session || req.query["session"];
    const whereCondition = { user_id: userid };

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
                    attributes: ["id", "name", 'game_type_id'],
                },
            ],
        })

        res.json({
            data,
            message: "Game History retrieved successfully",
            error: false,
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message, error: true });
    }
}




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
        histories.forEach(h => {
            const s = h.session;
            if (!s) return;

            if (!grouped[s.id]) {
                grouped[s.id] = {
                    sessionId: s.id,
                    roomName: s.room ? s.room.name : "Home Game",
                    date: new Date(s.createdAt).toLocaleDateString("en-US"),
                    addOns: [],
                    totalProfitLoss: 0,
                    stakes: s.stakes || null,
                    notes: s.session_notes || null,
                    game: h.games ? h.games.name : null
                };
            }

            // collect add-ons
            if (h.add_on_amount && Number(h.add_on_amount) > 0) {
                grouped[s.id].addOns.push(`$${h.add_on_amount}`);
            }

            // accumulate profit/loss
            const cashOut = Number(h.cash_out) || 0;
            const total = Number(h.buy_in || 0) + Number(h.re_buys || 0) + Number(h.add_on_amount || 0) + Number(h.dealer_tips || 0) + Number(h.meals_other_exp || 0);
            grouped[s.id].totalProfitLoss += (cashOut - total);
        });

        // 🔹 Format output
        const result = Object.values(grouped).map(s => ({
            room: s.roomName,
            date: s.date,
            addOns: s.addOns.length > 0 ? s.addOns.join(", ") : "None",
            profitLoss: `$${s.totalProfitLoss.toFixed(2)}`,
            stakes: s.stakes || "-",
            game: s.game,
            notes: s.notes || ""
        }));

        res.json({
            data: result,
            message: "Formatted game history retrieved successfully",
            error: false
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, error: true });
    }
};
