import api from '../../api/api';

/**
 * Login user – POST /auth/login (adjust endpoint as per your router base path)
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;  // { success: true, message: "Login successful" }
};

/**
 * Logout user – POST /auth/logout
 */
export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

/**
 * Get current user profile – GET /auth/profile
 */
export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;  // { success: true, data: { id, email, role } }
};