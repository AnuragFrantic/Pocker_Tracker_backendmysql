const { DataTypes } = require("sequelize");
const db = require("../config/db");

const PurchaseSubscription = db.sequelize.define("PurchaseSubscription", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Users",     // must match the actual table name for User
            key: "id"
        },

    },
    subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Subscriptions",
            key: "id"
        },

    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("active", "expired", "cancelled", "pending"),
        defaultValue: "pending"
    },

    payment_reference: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Payments",
            key: "id"
        },
    },
    sessions: {
        type: DataTypes.INTEGER,     // e.g. number of sessions attended
        allowNull: true
    },
    remaining_sessions: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD"
    },
    raw_subscription: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = PurchaseSubscription;
