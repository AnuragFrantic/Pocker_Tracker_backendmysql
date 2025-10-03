
const db = require("../models");

const Games = db.Games;
const GameTypes = db.GameTypes;







// Get all games
exports.getAllGames = async (req, res) => {
    try {
        const game_type = req.query.game_type || req.query["game-type"];
        let whereCondition = { deleted_at: null };

        if (game_type) {
            whereCondition.game_type_id = game_type;
        }

        const games = await Games.findAll({
            where: whereCondition,
            include: [
                {
                    model: GameTypes,
                    as: "game_type",
                    attributes: ["id", "name"],
                },
            ],
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
        const { name, game_type_id, is_active } = req.body;

        if (!game_type_id) {
            return res.status(400).json({ message: "Game type is required", error: true });
        }
        const game = await Games.create({ name, game_type_id, is_active });
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
        const { name, game_type_id, amount, is_active } = req.body;
        const game = await Games.findByPk(req.params.id);
        if (!game) return res.status(404).json({ message: "Game not found", error: true });

        game.name = name || game.name;
        game.game_type_id = game_type_id || game.game_type_id;
        game.is_active = is_active || game.is_active;


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






// exports.getGameStats = async (req, res) => {
//     try {
//         const game_type = req.query.game_type || req.query["game-type"];
//         let whereCondition = { deleted_at: null };

//         if (game_type) {
//             whereCondition.game_type_id = game_type;
//         }

//         const games = await Games.findAll({
//             where: whereCondition,
//             include: [
//                 { model: GameTypes, as: "game_type", attributes: ["id", "name"] },
//                 { model: Sessions, as: "sessions", attributes: [] }
//             ],
//             attributes: [
//                 "id",
//                 "name",
//                 "game_type_id",
//                 [
//                     Sequelize.fn("COUNT", Sequelize.col("sessions.id")),
//                     "sessions_played"
//                 ],
//                 [
//                     Sequelize.fn("SUM", Sequelize.col("sessions.profit_loss")),
//                     "total_profit_loss"
//                 ],
//                 [
//                     Sequelize.literal(`
//                         CASE
//                             WHEN COUNT(sessions.id) = 0
//                             THEN 0
//                             ELSE SUM(sessions.profit_loss) / COUNT(sessions.id)
//                         END
//                     `),
//                     "profit_loss_per_session"
//                 ]
//             ],
//             group: ["Games.id", "game_type.id"]
//         });

//         res.status(200).json({
//             data: games,
//             message: "Game statistics retrieved successfully",
//             error: false,
//         });
//     } catch (err) {
//         console.error("Error in getGameStats:", err);
//         res.status(500).json({ message: err.message, error: true });
//     }
// };

// exports.getSingleGameStats = async (req, res) => {
//     try {
//         const game = await Games.findByPk(req.params.id, {
//             include: [
//                 { model: GameTypes, as: "game_type", attributes: ["id", "name"] },
//                 { model: Sessions, as: "sessions", attributes: [] }
//             ],
//             attributes: [
//                 "id",
//                 "name",
//                 "game_type_id",
//                 [
//                     Sequelize.fn("COUNT", Sequelize.col("sessions.id")),
//                     "sessions_played"
//                 ],
//                 [
//                     Sequelize.fn("SUM", Sequelize.col("sessions.profit_loss")),
//                     "total_profit_loss"
//                 ],
//                 [
//                     Sequelize.literal(`
//                         CASE
//                             WHEN COUNT(sessions.id) = 0
//                             THEN 0
//                             ELSE SUM(sessions.profit_loss) / COUNT(sessions.id)
//                         END
//                     `),
//                     "profit_loss_per_session"
//                 ]
//             ],
//             group: ["Games.id", "game_type.id"]
//         });

//         if (!game) {
//             return res.status(404).json({ message: "Game not found", error: true });
//         }

//         res.status(200).json({
//             data: game,
//             message: "Single game statistics retrieved successfully",
//             error: false
//         });
//     } catch (err) {
//         console.error("Error in getSingleGameStats:", err);
//         res.status(500).json({ message: err.message, error: true });
//     }
// };
