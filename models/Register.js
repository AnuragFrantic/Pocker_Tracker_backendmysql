const { DataTypes } = require("sequelize");
const db = require("../config/db");

const User = db.sequelize.define("User", {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subscriptionId: {                   // FK to subscription table
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "Subscriptions",         // should match Subscription model table
            key: "id"
        }
    },
    phone: {
        type: DataTypes.STRING,           // phone numbers better as STRING
        allowNull: false
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
    zipcode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    free_session: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    paid_session: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = User;
