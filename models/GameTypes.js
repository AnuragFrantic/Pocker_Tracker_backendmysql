const { DataTypes } = require("sequelize");
const db = require("../config/db");

const GameTypes = db.sequelize.define("GameTypes", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deleted_at: {
        type: Date,
        allowNull: true,
        defaultValue: null
    }

}, {
    timestamps: true
});

module.exports = GameTypes;
