const debtService = require("./debt.service");

const getDebts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await debtService.getAllDebts(page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDebt = async (req, res) => {
  try {
    const debt = await debtService.getDebtById(req.params.id);
    res.status(200).json({ success: true, data: debt });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const addPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Valid amount required");
    }
    const debt = await debtService.recordPayment(req.params.id, parseFloat(amount));
    res.status(200).json({ success: true, data: debt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createLegacyDebtHandler = async (req, res) => {
  try {
    const { productId, customerName, customerPhone, quantity, price } = req.body;
    if (!productId || !quantity || !price) {
      throw new Error("productId, quantity, and price are required");
    }
    const debt = await debtService.createLegacyDebt({
      productId,
      customerName,
      customerPhone,
      quantity,
      price,
    });
    res.status(201).json({ success: true, data: debt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getDebts, getDebt, addPayment, createLegacyDebt: createLegacyDebtHandler };