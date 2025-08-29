const db = require("../models");
const Session = db.Sessions;
const GameTypes = db.GameTypes;
const PokerRoom = db.PokerRoom;
const Games = db.Games;
const User = db.User





exports.getAllSessions = async (req, res) => {
    try {
        const data = await Session.findAll({
            include: [{ model: GameTypes, as: "game_type" }, { model: PokerRoom, as: "room" }, { model: Games, as: "game" }]
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

exports.createSession = async (req, res) => {
    try {
        const data = req.body;
        const id = req.user.id; // logged-in user ID from Auth middleware

        // Check if user exists
        let user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User Not Found", error: true });
        }

        // Check if user has enough session points
        if (!user.session_points || user.session_points <= 0) {
            return res.status(200).json({
                message: "Insufficient session points. Please recharge your account.",
                error: true
            });
        }

        // Validate required fields
        if (!data.session_type_id) {
            return res.status(200).json({ message: "Session type ID is required", error: true });
        }
        if (!data.game_type_id) {
            return res.status(200).json({ message: "Game type ID is required", error: true });
        }

        // Deduct 1 session point
        user.session_points = user.session_points - 1;
        await user.save();



        // Create session and link with user
        const newSession = await Session.create({
            ...data,
            user_id: id // make sure Session has user_id FK
        });

        res.status(201).json({
            message: "Session created successfully & 1 point deducted",
            data: {
                session: newSession,
                remaining_points: user.session_points
            },
            error: false
        });
    } catch (err) {
        console.error("❌ Create Session Error:", err);
        res.status(500).json({ message: err.message, error: true });
    }
};
