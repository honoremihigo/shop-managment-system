// src/services/product/productService.js
import api from '../../api/api';

// Get all products with pagination
const fetchProducts = async (page = 1) => {
  const response = await api.get('/products', { params: { page } });
  return response.data;
};

// Get single product
const fetchProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Create products (expects array of { name, unit })
const createProducts = async (productsArray) => {
  const response = await api.post('/products', productsArray);
  return response.data;
};

// Update product
const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

// Delete product
const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export { fetchProducts, fetchProductById, createProducts, updateProduct, deleteProduct };