const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Stock = sequelize.define(
  "Stock",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reorder_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: "Minimum stock level before reordering",
    },
  },
  {
    tableName: "stocks",
  },
);

module.exports = Stock;
