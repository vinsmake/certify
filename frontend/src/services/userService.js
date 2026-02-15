// Servicio de usuarios (solo admin)

import api from './api';

const userService = {
  getAll: () =>
    api.get('/users').then((r) => r.data),

  create: (data) =>
    api.post('/users', data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/users/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};

export default userService;
