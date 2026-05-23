// src/services/main/debtService.js
import api from '../../api/api';

/**
 * Fetch all debts with pagination
 * GET /api/debts?page=1&limit=10
 */
export const fetchAllDebts = async (page = 1, limit = 10) => {
  const response = await api.get('/debts', { params: { page, limit } });
  return response.data;
};

/**
 * Fetch a single debt by ID
 * GET /api/debts/:id
 */
export const fetchDebtById = async (id) => {
  const response = await api.get(`/debts/${id}`);
  return response.data;
};

/**
 * Record a payment on a debt
 * POST /api/debts/:id/payments
 */
export const makePayment = async (id, amount) => {
  const response = await api.post(`/debts/${id}/payments`, { amount });
  return response.data;
};

/**
 * Create a legacy (old) debt – not linked to a sale
 * POST /api/debts/legacy
 */
export const createLegacyDebt = async ({ productId, customerName, customerPhone, quantity, price }) => {
  const response = await api.post('/debts/legacy', {
    productId,
    customerName,
    customerPhone,
    quantity,
    price,
  });
  return response.data;
};