const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Games = db.sequelize.define("Games", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    game_type_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "GameTypes",
            key: 'id'
        }
    },
    deleted_at: {
        type: DataTypes.DATE, // ✅ Use DataTypes.DATE
        allowNull: true,
        defaultValue: null   // optional
    }


}, {
    timestamps: true
});

module.exports = Games;
