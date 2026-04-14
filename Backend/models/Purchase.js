const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Purchase = sequelize.define("Purchase",{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    supply_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    supplier: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
},{
    tableName: "purchases"
})

module.exports = Purchase;