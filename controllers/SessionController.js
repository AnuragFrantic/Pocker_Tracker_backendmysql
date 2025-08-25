const db = require("../models");
const Session = db.Sessions;
const GameTypes = db.GameTypes;
const PokerRooms = db.PokerRooms;
const Games = db.Games;





exports.getAllSessions = async (req, res) => {
    try {
        const data = await Session.findAll({
            include: [{ model: GameTypes, as: "game_type" }, { model: PokerRooms, as: "room" }, { model: Games, as: "game" }]
        });
        res.status(200).json({
            data: data,
            message: "Session retrieved successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};