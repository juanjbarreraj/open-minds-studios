import { api } from './apiClient';

export const studentsApi = {
  // Manager scope
  list: () => api.get('/students'),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  remove: (id) => api.delete(`/students/${id}`),
  // Own profile (auto-creates an unapproved one for student accounts)
  me: () => api.get('/students/me'),
};
