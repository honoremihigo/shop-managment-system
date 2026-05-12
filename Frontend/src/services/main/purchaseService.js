// src/services/main/purchaseService.js
import api from '../../api/api';
import { fetchAllProducts } from './productService'; // reuse product fetcher

export const fetchPurchases = async (page = 1, limit = 10) => {
  const response = await api.get('/purchases', { params: { page, limit } });
  return response.data;
};

export const fetchPurchaseById = async (id) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

export const createPurchase = async (payload) => {
  const response = await api.post('/purchases', payload);
  return response.data;
};