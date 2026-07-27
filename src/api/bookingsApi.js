import { api } from './apiClient';

// Stored booking statuses are normalized lowercase; the UI shows these labels.
export const BOOKING_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Appointment Confirmed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const bookingStatusLabel = (status) => BOOKING_STATUS_LABELS[status] || status;

export const bookingsApi = {
  // Scoped by the backend: students get their own, tutors their assigned,
  // managers everything.
  list: () => api.get('/bookings'),
  // Anonymized live bookings for the scheduling grid (is_own marks yours).
  busy: () => api.get('/bookings/busy'),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  managerUpdate: (id, data) => api.patch(`/bookings/${id}`, data),
  remove: (id) => api.delete(`/bookings/${id}`),
};
