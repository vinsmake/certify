// 23.01 - Servicio de cursos

import api from './api';

const courseService = {
  getCourses: (params) =>
    api.get('/courses', { params }).then((r) => r.data),

  getCourse: (id) =>
    api.get(`/courses/${id}`).then((r) => r.data),

  createCourse: (data) =>
    api.post('/courses', data).then((r) => r.data),

  updateCourse: (id, data) =>
    api.put(`/courses/${id}`, data).then((r) => r.data),

  deleteCourse: (id) =>
    api.delete(`/courses/${id}`).then((r) => r.data),

  getCourseParticipants: (courseId) =>
    api.get(`/courses/${courseId}/participants`).then((r) => r.data),

  enrollParticipants: (courseId, participantIds) =>
    api.post(`/courses/${courseId}/participants`, { participant_ids: participantIds }).then((r) => r.data),

  updateParticipantStatus: (courseId, participantId, attendanceStatus) =>
    api.put(`/courses/${courseId}/participants/${participantId}`, {
      attendance_status: attendanceStatus,
    }).then((r) => r.data),

  addCourseDependency: (courseId, dependencyId, displayOrder) =>
    api.post(`/courses/${courseId}/dependencies`, { dependency_id: dependencyId, display_order: displayOrder }).then((r) => r.data),

  removeCourseDependency: (courseId, dependencyId) =>
    api.delete(`/courses/${courseId}/dependencies/${dependencyId}`).then((r) => r.data),
};

export default courseService;
