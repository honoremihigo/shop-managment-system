// src/services/main/saleService.js
import api from '../../api/api';
import { fetchStocks } from './stockService'; // reuse the stock fetch function

// Fetch sales with pagination (backend uses limit from query, but we'll pass limit as param; backend already has default 10)
const fetchSales = async (page = 1, limit = 10) => {
  const response = await api.get('/sales', { params: { page, limit } });
  return response.data;
};

// Get all stocks for the selector (similar to fetchAllProducts)
const fetchAllStocks = async () => {
  let all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetchStocks(page);
    all = all.concat(res.data);
    totalPages = res.totalPages;
    page++;
  } while (page <= totalPages);

  return all;
};

// Create bulk sales
const createBulkSales = async (salesArray) => {
  const response = await api.post('/sales', { sales: salesArray });
  return response.data;
};


const fetchTodaySales = async () => {
  const response = await api.get('/sales/today');
  return response.data;
};

export { fetchSales, fetchAllStocks, createBulkSales , fetchTodaySales };