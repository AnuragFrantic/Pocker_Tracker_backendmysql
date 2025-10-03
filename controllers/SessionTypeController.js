const db = require("../models");
const SessionTypes = db.SessionTypes;

// Get all session types
exports.getAllSessionTypes = async (req, res) => {
    try {
        const types = await SessionTypes.findAll({
            where: { deleted_at: null },
        });
        res.json({
            data: types,
            message: "Session types retrieved successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Get a session type by ID
exports.getSessionTypeById = async (req, res) => {
    try {
        const type = await SessionTypes.findByPk(req.params.id);
        if (!type) {
            return res.status(404).json({ message: "Session type not found", error: true });
        }
        res.json({
            data: type,
            message: "Session type retrieved successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Create a new session type
exports.createSessionType = async (req, res) => {
    try {
        const { name } = req.body;
        const type = await SessionTypes.create({ name });
        res.status(201).json({
            data: type,
            message: "Session type created successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};

// Update a session type
exports.updateSessionType = async (req, res) => {
    try {
        const { name } = req.body;
        const type = await SessionTypes.findByPk(req.params.id);
        if (!type) {
            return res.status(404).json({ message: "Session type not found", error: true });
        }
        type.name = name || type.name;
        await type.save();
        res.json({
            data: type,
            message: "Session type updated successfully",
            error: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};



exports.deleteSessionType = async (req, res) => {
    try {
        const type = await SessionTypes.findByPk(req.params.id);
        if (!type) {
            return res.status(404).json({ message: "Session type not found", error: true });
        }
        await type.update({ deleted_at: new Date() }); // set current timestamp

        res.json({ message: "Session type deleted", error: false });
    } catch (err) {
        res.status(500).json({ message: err.message, error: true });
    }
};