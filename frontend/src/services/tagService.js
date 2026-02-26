import api from './api';

const tagService = {
  getAll: () =>
    api.get('/tags').then((r) => r.data),

  create: (data) =>
    api.post('/tags', data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/tags/${id}`, data).then((r) => r.data),

  delete: (id) =>
    api.delete(`/tags/${id}`).then((r) => r.data),

  uploadLogo: (id, file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post(`/tags/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};

export default tagService;
