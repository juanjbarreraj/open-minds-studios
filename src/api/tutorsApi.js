import { api } from './apiClient';

export const tutorsApi = {
  // Managers get every tutor with all fields; students get approved tutors
  // with safe public fields only.
  list: () => api.get('/tutors'),
  create: (data) => api.post('/tutors', data),
  update: (id, data) => api.patch(`/tutors/${id}`, data),
  remove: (id) => api.delete(`/tutors/${id}`),
  me: () => api.get('/tutors/me'),
  // Link (or unlink) this profile to the portal account registered with the
  // same email address.
  link: (id, link = true) => api.post(`/tutors/${id}/link`, { link }),
};
