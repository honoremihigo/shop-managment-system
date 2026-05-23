const User = require("./User");
const Product = require("./Product");
const Purchase = require("./Purchase");
const PurchasedItems = require("./PurchasedItems");
const Stock = require("./Stock");
const Sale = require("./Sale");
const Debt = require("./Debt");

const defineRelationships = () => {
  // Define relationships between models

  // A Purchase belongs to a User, and a User can have many Purchases
  Purchase.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  User.hasMany(Purchase, { foreignKey: "userId", as: "purchases" });

  // A PurchasedItem belongs to a Purchase, and a Purchase can have many PurchasedItems
  PurchasedItems.belongsTo(Purchase, {
    foreignKey: "purchaseId",
    as: "purchase",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Purchase.hasMany(PurchasedItems, {
    foreignKey: "purchaseId",
    as: "purchasedItems",
  });

  // A PurchasedItem belongs to a Product, and a Product can have many PurchasedItems
  PurchasedItems.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Product.hasMany(PurchasedItems, {
    foreignKey: "productId",
    as: "purchasedItems",
  });

  //stock relationships
  Stock.belongsTo(Product, {
    foreignKey: "productId",
    as: "product",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Product.hasOne(Stock, { foreignKey: "productId", as: "stock" });

  //Sales relationships
  Sale.belongsTo(Stock, {
    foreignKey: "stockId",
    as: "stock",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  Stock.hasMany(Sale, { foreignKey: "stockId", as: "sales" });

  Sale.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  User.hasMany(Sale, { foreignKey: "userId", as: "sales" , onDelete: "CASCADE", onUpdate: "CASCADE" });

  // Debt associations
  Sale.hasOne(Debt, { foreignKey: "saleId", as: "debt" , onDelete: "CASCADE", onUpdate: "CASCADE" });
  Debt.belongsTo(Sale, { foreignKey: "saleId", as: "sale", onDelete: "CASCADE", onUpdate: "CASCADE" });

  // Legacy debt → product
  Debt.belongsTo(Product, { foreignKey: "productId", as: "product", onDelete: "CASCADE", onUpdate: "CASCADE" }); // ← add this
  Product.hasMany(Debt, { foreignKey: "productId", as: "debts", onDelete: "CASCADE", onUpdate: "CASCADE" }); // optional, if you want inverse
};

module.exports = defineRelationships;
