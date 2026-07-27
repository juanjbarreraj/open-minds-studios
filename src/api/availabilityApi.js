import { api } from './apiClient';

export const availabilityApi = {
  list: (tutorId) => api.get(tutorId ? `/availability?tutor_id=${encodeURIComponent(tutorId)}` : '/availability'),
  create: (data) => api.post('/availability', data),
  update: (id, data) => api.patch(`/availability/${id}`, data),
  remove: (id) => api.delete(`/availability/${id}`),
};
