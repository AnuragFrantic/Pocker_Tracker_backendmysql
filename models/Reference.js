const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Reference = db.sequelize.define("Reference", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reference: { type: DataTypes.STRING, allowNull: false, unique: true },
    subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Subscriptions", key: "id" },
    },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { timestamps: true });

module.exports = Reference;
