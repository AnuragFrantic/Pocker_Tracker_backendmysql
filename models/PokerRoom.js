const { DataTypes } = require("sequelize");
const db = require("../config/db");

const PokerRoom = db.sequelize.define("PokerRoom", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    lat: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    long: {
        type: DataTypes.DOUBLE,
        allowNull: true,
    },
    poker_links: {
        type: DataTypes.STRING,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,           // e.g. "Bellagio Poker Room"
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,        // general info about the poker room
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "USA"
    },


    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,       // total players the room can seat
    },

    // game_types: {
    //     type: DataTypes.STRING,  // e.g. ["Texas Hold'em", "Omaha", "Stud"]
    //     allowNull: true
    // },

    // session_type: {
    //     type: DataTypes.STRING,  // e.g. ["Private", "Live", "Online"]
    //     allowNull: true
    // },


    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = PokerRoom;


