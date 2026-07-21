const { DataTypes } = require("sequelize");
const db = require("../config/db");

// Stores every user ID that has redeemed a reference. A user can redeem once.
const ReferenceUser = db.sequelize.define("ReferenceUser", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    reference_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "References", key: "id" },
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: "Users", key: "id" },
    },
}, { timestamps: true });

module.exports = ReferenceUser;
