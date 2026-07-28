import { api } from './apiClient';

// Stored module statuses are normalized; the UI shows the familiar labels.
export const MODULE_STATUS_LABELS = {
  assigned: 'Assigned',
  submitted: 'Submitted for grading',
  graded: 'Graded',
};

export const moduleStatusLabel = (status) => MODULE_STATUS_LABELS[status] || status;

export const modulesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(qs ? `/modules?${qs}` : '/modules');
  },
  create: (data) => api.post('/modules', data),
  submit: (id, fileId) => api.post(`/modules/${id}/submit`, { file_id: fileId }),
  grade: (id, grade, feedback) => api.post(`/modules/${id}/grade`, { grade, feedback }),
  // Corrects an already-graded module. The previous value is preserved in the
  // revision history rather than overwritten.
  correctGrade: (id, grade, feedback, correctionReason) =>
    api.post(`/modules/${id}/grade-correction`, { grade, feedback, correction_reason: correctionReason }),
  gradeRevisions: (id) => api.get(`/modules/${id}/grade-revisions`),
};
