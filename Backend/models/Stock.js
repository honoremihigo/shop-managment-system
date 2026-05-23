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
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 1),
      allowNull: false
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(10, 1),
      allowNull: false,
    },
    reorder_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: "Minimum stock level before reordering",
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    tableName: "stocks",
  },
);

module.exports = Stock;
  