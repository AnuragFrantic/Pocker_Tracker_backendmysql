


const db = require("../models")

const User = db.User;



exports.getAllUSers = async (req, res) => {
    try {
        let data = await User.findAll();
        res.status(200).json({ message: "All Users fetch Successfully ", data, error: false })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: true })
    }
}

exports.getProfile = async (req, res) => {
    try {
        let id = req.user.id;
        let user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }
        res.status(200).json({ message: "User profile fetched successfully", data: user, error: false });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: true });
    }
}