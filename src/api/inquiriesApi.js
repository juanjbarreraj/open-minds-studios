import { api } from './apiClient';

export const inquiriesApi = {
  // Public: submit the contact form. The backend stores the inquiry and
  // handles notifications through its integration service.
  create: (data) => api.post('/inquiries', data),
  // Manager scope
  list: (status) => api.get(status ? `/inquiries?status=${encodeURIComponent(status)}` : '/inquiries'),
  update: (id, data) => api.patch(`/inquiries/${id}`, data),
};

// Stored inquiry statuses are normalized; these are the labels shown to staff.
export const INQUIRY_STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  closed: 'Closed',
};

export const inquiryStatusLabel = (status) => INQUIRY_STATUS_LABELS[status] || status;
