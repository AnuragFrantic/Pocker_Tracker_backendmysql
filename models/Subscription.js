const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Subscription = db.sequelize.define("Subscription", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,        // e.g. "Free", "Pro", "Elite"
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,     // e.g. "Best for casual poker players"
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),   // store money properly
        allowNull: false,
        defaultValue: 0.00,  // free plan default
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD"
    },
    duration_days: {
        type: DataTypes.INTEGER,
        allowNull: false,   // e.g. 30 for monthly, 365 for yearly
    },
    max_sessions: {
        type: DataTypes.INTEGER,
        allowNull: true,    // how many poker sessions they can track
    },
    // max_players: {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,    // how many players they can add/analyze
    // },


    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,

    }
}, {
    timestamps: true
});

module.exports = Subscription;
