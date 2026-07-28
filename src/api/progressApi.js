import { api } from './apiClient';

// Progress belongs to a student and is maintained by their tutor or a
// manager. Students read their own record only; the server enforces all of it.
export const progressApi = {
  // Omit studentId to read the signed-in student's own progress.
  get: (studentId) => api.get(studentId ? `/progress/${studentId}` : '/progress'),
  createMetric: (studentId, data) => api.post(`/progress/${studentId}/metrics`, data),
  updateMetric: (id, data) => api.patch(`/progress/metrics/${id}`, data),
  removeMetric: (id) => api.delete(`/progress/metrics/${id}`),
  createFocus: (studentId, data) => api.post(`/progress/${studentId}/focus`, data),
  updateFocus: (id, data) => api.patch(`/progress/focus/${id}`, data),
  removeFocus: (id) => api.delete(`/progress/focus/${id}`),
};
