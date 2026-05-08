// src/services/report/reportService.js
import api from '../../api/api'; // your axios instance or fetch wrapper

const getDashboardStats = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data; // { success, data: { overview, sales, purchases } }
};

const getDailySalesReport = async (days = 7) => {
  const response = await api.get('/reports/daily-sales', { params: { days } });
  return response.data;
};

const getTopProducts = async (limit = 5, startDate, endDate) => {
  const response = await api.get('/reports/top-products', { params: { limit, startDate, endDate } });
  return response.data;
};

const getLowStockProducts = async (threshold = 10) => {
  const response = await api.get('/reports/low-stock', { params: { threshold, page: 1, limit: 5 } });
  return response.data;
};

export { getDashboardStats, getDailySalesReport, getTopProducts, getLowStockProducts };


