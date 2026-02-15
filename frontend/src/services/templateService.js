// Servicio de plantillas de certificado

import api from './api';

const templateService = {
  getTemplates: () =>
    api.get('/templates').then((r) => r.data),

  getTemplate: (id) =>
    api.get(`/templates/${id}`).then((r) => r.data),

  // Genera un PDF de preview de la plantilla y lo abre en nueva pestana
  previewTemplate: (id) =>
    api.post(`/templates/${id}/preview`, {}, { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    }),
};

export default templateService;
