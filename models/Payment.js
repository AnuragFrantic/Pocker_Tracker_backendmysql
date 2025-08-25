const { DataTypes } = require("sequelize");
const db = require("../config/db");

const Payment = db.sequelize.define("Payment", {
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
    subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Subscriptions",
            key: "id"
        },
    },

    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD"
    },
    status: {
        type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
        allowNull: false,
        defaultValue: "pending"
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: true, // e.g. "card", "paypal", "razorpay", "stripe"
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true, // gateway transaction id
    },
    provider_response: {
        type: DataTypes.JSON, // raw JSON from Stripe/Razorpay/etc
        allowNull: true
    },
    paid_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    refunded_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Payment;
