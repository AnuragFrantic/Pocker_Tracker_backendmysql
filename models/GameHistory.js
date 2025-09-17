const { DataTypes } = require("sequelize");
const db = require("../config/db");

const GameHistory = db.sequelize.define("GameHistory", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Sessions", key: "id" }
    },
    game_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Games", key: "id" }
    },
    hands_played: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    winner_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" }
    },
    remarks: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true
});

module.exports = GameHistory;
