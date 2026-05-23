const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Debt = sequelize.define("Debt", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  saleId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: "sale_id",
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "customer_name",
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    field: "customer_phone",
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "total_amount",
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: "paid_amount",
  },
  status: {
    type: DataTypes.ENUM("pending", "paid", "overdue"),
    defaultValue: "pending",
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: "product_id",
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true,
    field: "quantity",
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: "price",
  }
}, {
  tableName: "debts",
});

module.exports = Debt;