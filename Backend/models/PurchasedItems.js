const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchasedItems = sequelize.define("PurchasedItems", {
    // Define your model attributes here
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    tableName: "purchased_items"
});

module.exports = PurchasedItems;