import { api } from './apiClient';

export const tutorsApi = {
  // Managers get every tutor with all fields; students get approved tutors
  // with safe public fields only.
  list: () => api.get('/tutors'),
  create: (data) => api.post('/tutors', data),
  update: (id, data) => api.patch(`/tutors/${id}`, data),
  remove: (id) => api.delete(`/tutors/${id}`),
  me: () => api.get('/tutors/me'),
};
