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
        type: DataTypes.DATE, // ✅ Use DataTypes.DATE
        allowNull: true,
        defaultValue: null   // optional
    }

}, {
    timestamps: true
});

module.exports = GameTypes;
