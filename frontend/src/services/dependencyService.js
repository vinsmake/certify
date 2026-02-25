// Servicio de dependencias

import api from './api';

const dependencyService = {
  getAll: () =>
    api.get('/dependencies').then((r) => r.data),

  getActive: () =>
    api.get('/dependencies', { params: { active_only: 'true' } }).then((r) => r.data),

  create: (data) =>
    api.post('/dependencies', data).then((r) => r.data),

  update: (id, data) =>
    api.put(`/dependencies/${id}`, data).then((r) => r.data),

  deactivate: (id) =>
    api.delete(`/dependencies/${id}`).then((r) => r.data),

  // Sube logo usando FormData (campo: logo)
  uploadLogo: (id, file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post(`/dependencies/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  // Sube firma del encargado usando FormData (campo: signature)
  uploadSignature: (id, file) => {
    const form = new FormData();
    form.append('signature', file);
    return api.post(`/dependencies/${id}/signature`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  // Elimina la firma del encargado
  deleteSignature: (id) =>
    api.delete(`/dependencies/${id}/signature`).then((r) => r.data),
};

export default dependencyService;
