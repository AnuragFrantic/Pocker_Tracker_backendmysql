const { DataTypes } = require("sequelize");
const db = require("../config/db");

const SessionTypes = db.sequelize.define("SessionTypes", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    deleted_at: {
        type: Date,
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true
});

module.exports = SessionTypes;
