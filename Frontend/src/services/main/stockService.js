// src/services/stock/stockService.js
import api from '../../api/api';
import { fetchProducts } from '../main/productService';

// ── stock CRUD ──

const fetchStocks = async (page = 1) => {
  const response = await api.get('/stocks', { params: { page } });
  return response.data;
};

const addStock = async (stockDataArray) => {
  const response = await api.post('/stocks', stockDataArray);
  return response.data;
};

const updateStock = async (id, data) => {
  const response = await api.put(`/stocks/${id}`, data);
  return response.data;
};

const deleteStock = async (id) => {
  const response = await api.delete(`/stocks/${id}`);
  return response.data;
};

// ── all products (for select) ──

const fetchAllProducts = async () => {
  let all = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await fetchProducts(page);
    all = all.concat(res.data);
    totalPages = res.totalPages;
    page++;
  } while (page <= totalPages);

  return all;
};

export { fetchStocks, addStock, updateStock, deleteStock, fetchAllProducts };