const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Sessions = db.sequelize.define("Sessions", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "PokerRooms",
            key: "id"
        }
    },
    game_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "GameTypes",
            key: "id"
        }
    },
    games_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Games",
            key: "id"
        }
    },
    buy_in: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    meals_other_exp: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    add_on_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    re_buys: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    place: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lat: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    long: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    dealer_tips: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cash_out: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    session_notes: {
        type: DataTypes.STRING,
        allowNull: false,
    },




}, {
    timestamps: true
});

module.exports = Sessions;
