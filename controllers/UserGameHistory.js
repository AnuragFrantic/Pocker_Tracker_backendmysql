const db = require("../models");
const UserGameHistory = db.UserGameHistory;
const Games = db.Games;





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

