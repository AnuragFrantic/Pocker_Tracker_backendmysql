const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Games = db.sequelize.define("Games", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    game_type_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "GameTypes",
            key: 'id'
        }
    },
    deleted_at: {
        type: Date,
        allowNull: true,
        defaultValue: null
    }


}, {
    timestamps: true
});

module.exports = Games;
