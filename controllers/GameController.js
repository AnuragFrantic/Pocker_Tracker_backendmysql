const db = require("../models");
const Games = db.Games;
const GameTypes = db.GameTypes;

// Get all games
exports.getAllGames = async (req, res) => {
    try {
        const games = await Games.findAll({
            include: [
                {
                    model: GameTypes,
                    as: "game_type", //  must match association alias
                    attributes: ["id", "name"], // optional: only return specific fields
                },
            ],
            where: { deleted_at: null },
        });

        res.status(200).json({
            data: games,
            message: "Games retrieved successfully",
            error: false,
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};


// Get single game by ID
exports.getGameById = async (req, res) => {
    try {
        const game = await Games.findByPk(req.params.id, {
            include: [{ model: GameTypes, as: "game_type" }]
        });
        if (!game) return res.status(404).json({ message: "Game not found", error: true });
        res.status(200).json({ data: game, message: "Game retrieved successfully", error: false });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Create a new game
exports.createGame = async (req, res) => {
    try {
        const { name, game_type_id } = req.body;

        if (!game_type_id) {
            return res.status(400).json({ message: "Game type is required", error: true });
        }
        const game = await Games.create({ name, game_type_id });
        res.status(201).json({
            data: game,
            message: "Game created successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Update a game
exports.updateGame = async (req, res) => {
    try {
        const { name, game_type_id, amount } = req.body;
        const game = await Games.findByPk(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found", error: true });

        game.name = name || game.name;
        game.game_type_id = game_type_id || game.game_type_id;

        await game.save();

        res.status(200).json({
            data: game,
            message: "Game updated successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Delete a game
exports.deleteGame = async (req, res) => {
    try {
        const game = await Games.findByPk(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found", error: true });

        await game.update({ deleted_at: new Date() });
        res.status(200).json({ message: "Game deleted successfully", error: false });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};
