const { DataTypes } = require("sequelize");
const db = require("../config/db");

const AppleNotification = db.sequelize.define("AppleNotification", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    original_transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notification_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    environment: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    auto_renew_status: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    expires_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    received_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

module.exports = AppleNotification;
