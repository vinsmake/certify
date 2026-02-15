// 25.01 - Servicio de certificados

import api from './api';

const certificateService = {
  getCertificates: (params) =>
    api.get('/certificates', { params }).then((r) => r.data),

  getCertificate: (id) =>
    api.get(`/certificates/${id}`).then((r) => r.data),

  emitCertificates: (data) =>
    api.post('/certificates/emit', data).then((r) => r.data),

  // 25.07-25.08 - Descarga el PDF usando Axios (incluye JWT) y dispara la descarga en el navegador
  downloadCertificate: (id, uuid) =>
    api.get(`/certificates/${id}/download`, { responseType: 'blob' }).then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${uuid || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }),

  revokeCertificate: (id, reason) =>
    api.post(`/certificates/${id}/revoke`, { reason }).then((r) => r.data),
};

export default certificateService;
