const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Product = sequelize.define("Product", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.ENUM(
      "piece", // Individual items
      "pack", // Multi-pack
      "bottle", // Drinks
      "can", // Canned goods
      "carton", // Milk, juice boxes
      "box", // Cereal, snacks
      "bag", // Chips, rice
      "kg", // Weight (vegetables, meat)
      "g", // Small weight (spices)
      "L", // Volume (large drinks)
      "ml", // Small volume
      "loaf", // Bread
    ),
    allowNull: false,
    defaultValue: "piece",
    comment: "Unit of measurement for this product",
  },
},{
    tableName: "products"
});

module.exports = Product;
