const { DataTypes } = require("sequelize");
const db = require("../config/db");

const UserGameHistory = db.sequelize.define("UserGameHistory", {
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
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" }
    },
    games_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Games", key: "id" }
    },
    buy_in: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    re_buys: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    add_on_amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    cash_out: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    profit_loss: {
        type: DataTypes.DOUBLE, // cash_out - (buy_in + add_on_amount + rebuys)
        allowNull: false,
        defaultValue: 0,
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true
});

module.exports = UserGameHistory;
