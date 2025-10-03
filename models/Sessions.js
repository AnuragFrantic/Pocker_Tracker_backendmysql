const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Sessions = db.sequelize.define("Sessions", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Users",
            key: "id"
        },

    },
    session_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "SessionTypes",
            key: "id"
        }
    },
    room_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "PokerRooms",
            key: "id"
        }
    },
    room_name: {
        type: DataTypes.STRING,
        allowNull: true,
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
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },
    re_buys: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    total_amount: {
        type: DataTypes.DOUBLE,
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
    other_game_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    platform_site: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    stakes: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },

    long: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    dealer_tips: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    cash_out: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    session_notes: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: true
});

module.exports = Sessions;
