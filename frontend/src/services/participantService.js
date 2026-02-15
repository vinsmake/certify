// 24.01 - Servicio de participantes

import api from './api';

const participantService = {
  getParticipants: (params) =>
    api.get('/participants', { params }).then((r) => r.data),

  getParticipant: (id) =>
    api.get(`/participants/${id}`).then((r) => r.data),

  createParticipant: (data) =>
    api.post('/participants', data).then((r) => r.data),

  updateParticipant: (id, data) =>
    api.put(`/participants/${id}`, data).then((r) => r.data),

  deleteParticipant: (id) =>
    api.delete(`/participants/${id}`).then((r) => r.data),

  getParticipantCertificates: (id) =>
    api.get(`/participants/${id}/certificates`).then((r) => r.data.certificates || []),
};

export default participantService;
