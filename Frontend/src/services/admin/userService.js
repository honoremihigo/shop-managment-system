// src/services/user/userService.js
import api from '../../api/api';

const createUser = async (email, password) => {
  const response = await api.post('/admin', { email, password });
  return response.data;
};

const fetchAllUsers = async () => {
  const response = await api.get('/admin');
  return response.data;
};

const deleteUser = async (id) => {
  const response = await api.delete(`/admin/${id}`);
  return response.data;
};

export { createUser, fetchAllUsers, deleteUser };