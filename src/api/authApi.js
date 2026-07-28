import { api } from './apiClient';

export const authApi = {
  // Returns { user, student, tutor } or throws ApiError(401).
  me: () => api.get('/auth/me'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  // `invite` is the one-time token from a manager's invitation link; when
  // present the new account is linked to the intended profile immediately.
  register: ({ email, password, full_name, account_type, phone, invite }) =>
    api.post('/auth/register', {
      email, password, full_name, account_type, phone,
      ...(invite ? { invite } : {}),
    }),
  logout: () => api.post('/auth/logout'),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }),
};
