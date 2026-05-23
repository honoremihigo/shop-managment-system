const { Debt, Sale, Stock, Product, User, sequelize } = require("../../models");

const getAllDebts = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Debt.findAndCountAll({
    include: [
      {
        model: Sale,
        as: "sale",
        include: [
          {
            model: Stock,
            as: "stock",
            include: [{ model: Product, as: "product", attributes: ["name"] }],
          },
          { model: User, as: "user", attributes: ["email"] },
        ],
      },
      {
        model: Product,
        as: "product",
        attributes: ["name"],
      },
    ],
    order: [["createdAt", "DESC"]],
    offset,
    limit,
  });

  return {
    debts: rows,
    totalItems: count,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
};

const getDebtById = async (id) => {
  const debt = await Debt.findByPk(id, {
    include: [
      {
        model: Sale,
        as: "sale",
        include: [
          {
            model: Stock,
            as: "stock",
            include: [{ model: Product, as: "product" }],
          },
          { model: User, as: "user", attributes: ["email"] },
        ],
      },
      {
        model: Product,
        as: "product",
        attributes: ["name"],
      },
    ],
  });
  if (!debt) throw new Error("Debt not found");
  return debt;
};

const createLegacyDebt = async ({ productId, customerName, customerPhone, quantity, price }) => {
  const totalAmount = parseFloat(quantity) * parseFloat(price);
  const debt = await Debt.create({
    productId,
    customerName: customerName || null,
    customerPhone: customerPhone || null,
    quantity: parseFloat(quantity),
    price: parseFloat(price),
    totalAmount,
    paidAmount: 0,
    status: "pending",
    saleId: null,
  });
  return debt;
};

const recordPayment = async (id, amount) => {
  const debt = await Debt.findByPk(id);
  if (!debt) throw new Error("Debt not found");
  if (debt.status === "paid") throw new Error("Debt already paid");

  const newPaid = parseFloat(debt.paidAmount) + parseFloat(amount);
  debt.paidAmount = newPaid;
  const total = parseFloat(debt.totalAmount);

  if (newPaid >= total) {
    debt.status = "paid";
  }

  await debt.save();
  return debt;
};

module.exports = { getAllDebts, getDebtById, createLegacyDebt, recordPayment };