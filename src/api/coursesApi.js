import { api } from './apiClient';

export const coursesApi = {
  list: () => api.get('/courses'),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  remove: (id) => api.delete(`/courses/${id}`),
};

export const tutorCoursesApi = {
  list: (tutorId) => api.get(tutorId ? `/tutor-courses?tutor_id=${encodeURIComponent(tutorId)}` : '/tutor-courses'),
  create: (tutor_id, course_id) => api.post('/tutor-courses', { tutor_id, course_id }),
  remove: (id) => api.delete(`/tutor-courses/${id}`),
};
