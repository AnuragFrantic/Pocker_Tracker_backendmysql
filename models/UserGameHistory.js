// const { DataTypes } = require("sequelize");
// const db = require("../config/db");

// const UserGameHistory = db.sequelize.define("UserGameHistory", {
//     id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true,
//     },
//     session_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: { model: "Sessions", key: "id" }
//     },
//     user_id: {
//         type: DataTypes.UUID,
//         allowNull: false,
//         references: { model: "Users", key: "id" }
//     },
//     dealer_tips : {

//     },
//     games_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: { model: "Games", key: "id" }
//     },
//     buy_in: {
//         type: DataTypes.DOUBLE,
//         allowNull: false,
//         defaultValue: 0,
//     },
//     re_buys: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         defaultValue: 0,
//     },
//     add_on_amount: {
//         type: DataTypes.DOUBLE,
//         allowNull: false,
//         defaultValue: 0,
//     },
//     cash_out: {
//         type: DataTypes.DOUBLE,
//         allowNull: false,
//         defaultValue: 0,
//     },
//     profit_loss: {
//         type: DataTypes.DOUBLE,
//         allowNull: false,
//         defaultValue: 0,
//     },
//     notes: {
//         type: DataTypes.STRING,
//         allowNull: true,
//     }
// }, {
//     timestamps: true
// });

// module.exports = UserGameHistory;


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
        references: { model: "Sessions", key: "id" },
    },

    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
    },

    games_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Games", key: "id" },
    },


    buy_in: {
        type: DataTypes.JSON,  // example: [{ amount: 500 }, { amount: 400 }]
        allowNull: false,
        defaultValue: [],
    },

    re_buys: {
        type: DataTypes.JSON,  // example: [{ amount: 200 }]
        allowNull: false,
        defaultValue: [],
    },

    add_on_amount: {
        type: DataTypes.JSON,  // example: [{ amount: 300 }, { amount: 150 }]
        allowNull: false,
        defaultValue: [],
    },

    dealer_tips: {
        type: DataTypes.JSON,  // example: [{ amount: 100 }]
        allowNull: false,
        defaultValue: [],
    },

    cash_out: {
        type: DataTypes.JSON,  // example: [{ amount: 800 }]
        allowNull: false,
        defaultValue: [],
    },

    profit_loss: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
    },

    notes: {
        type: DataTypes.STRING,
        allowNull: true,
    },

}, {
    timestamps: true,
    tableName: "UserGameHistory",
});

module.exports = UserGameHistory;
