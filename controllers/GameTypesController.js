const db = require("../models");
const GameTypes = db.GameTypes;

// Get all Game types
exports.getAllGameTypes = async (req, res) => {
    try {
        const types = await GameTypes.findAll({
            where: { deleted_at: null },
        });

        res.json({
            data: types,
            message: "Game types retrieved successfully",
            error: false,
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};




// Create a new Game type
exports.createGameType = async (req, res) => {
    try {
        const { name } = req.body;
        const type = await GameTypes.create({ name });
        res.status(201).json({
            data: type,
            message: "Game type created successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Update a Game type
exports.updateGameType = async (req, res) => {
    try {
        const { name } = req.body;
        const type = await GameTypes.findByPk(req.params.id);
        if (!type) {
            return res.status(404).json({ message: "Game type not found", error: true });
        }
        type.name = name || type.name;
        await type.save();
        res.json({
            data: type,
            message: "Game type updated successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Delete a Game type
exports.deleteGameType = async (req, res) => {
    try {
        const type = await GameTypes.findByPk(req.params.id);

        if (!type) {
            return res.status(404).json({ message: "Game type not found", error: true });
        }

        await type.update({ deleted_at: new Date() }); // set current timestamp

        res.json({ message: "Game type  deleted", error: false });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};
