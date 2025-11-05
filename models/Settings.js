const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Settings = db.sequelize.define("Settings", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },

    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }


}, {
    timestamps: true
});

module.exports = Settings;
