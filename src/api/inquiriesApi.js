import { api } from './apiClient';

export const inquiriesApi = {
  // Public: submit the contact form. The backend stores the inquiry and
  // handles notifications through its integration service.
  create: (data) => api.post('/inquiries', data),
  // Manager scope
  list: () => api.get('/inquiries'),
};
