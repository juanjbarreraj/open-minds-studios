import { api } from './apiClient';

export const authApi = {
  // Returns { user, student, tutor } or throws ApiError(401).
  me: () => api.get('/auth/me'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: ({ email, password, full_name, account_type, phone }) =>
    api.post('/auth/register', { email, password, full_name, account_type, phone }),
  logout: () => api.post('/auth/logout'),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }),
};
