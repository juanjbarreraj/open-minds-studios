import { api } from './apiClient';

// Local invitations replace email verification: a manager creates one, hands
// over the link, and registration through it links the account to the
// intended profile. The raw token is returned once, at creation.
export const invitationsApi = {
  list: () => api.get('/invitations'),
  create: (data) => api.post('/invitations', data),
  revoke: (id) => api.post(`/invitations/${id}/revoke`),
  // Public: lets the registration screen show who a link is for.
  preview: (token) => api.get(`/invitations/preview?token=${encodeURIComponent(token)}`),
};
