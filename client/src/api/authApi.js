import apiClient from './client.js';

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }).then((r) => r.data),
  register: (name, email, password) => apiClient.post('/auth/register', { name, email, password }).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
};

export default authApi;
