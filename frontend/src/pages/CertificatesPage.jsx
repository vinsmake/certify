// 25.02 / 25.04 - Pagina de certificados con lista, filtros y detalle

import React, { useState, useEffect, useCallback } from 'react';
import certificateService from '../services/certificateService';
import courseService from '../services/courseService';
import CertificateList from '../components/certificates/CertificateList';
import CertificateDetail from '../components/certificates/CertificateDetail';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';

const STATUS_OPTIONS = [
  { value: 'valid',   label: 'Valido'   },
  { value: 'revoked', label: 'Revocado' },
];

const CertificatesPage = () => {
  // Lista
  const [certificates, setCertificates] = useState([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const LIMIT = 20;

  // 25.04 - Filtros
  const [statusFilter,  setStatusFilter]  = useState('');
  const [courseFilter,  setCourseFilter]  = useState('');
  const [allCourses,    setAllCourses]    = useState([]);

  // Modal detalle
  const [viewCert,    setViewCert]    = useState(null);
  const [successMsg,  setSuccessMsg]  = useState('');
  const [downloadErr, setDownloadErr] = useState('');

  // Cargar cursos para el filtro
  useEffect(() => {
    courseService.getCourses({ limit: 100 })
      .then((data) => setAllCourses(data.data || []))
      .catch(() => {});
  }, []);

  const loadCertificates = useCallback(() => {
    setLoading(true);
    certificateService.getCertificates({
      page,
      limit: LIMIT,
      status:    statusFilter  || undefined,
      course_id: courseFilter  || undefined,
    })
      .then((data) => { setCertificates(data.data || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter, courseFilter]);

  useEffect(() => { loadCertificates(); }, [loadCertificates]);

  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); setPage(1); };
  const handleCourseFilter = (e) => { setCourseFilter(e.target.value); setPage(1); };

  // Abrir detalle (carga datos completos del certificado)
  const handleView = (cert) => {
    certificateService.getCertificate(cert.id)
      .then((full) => setViewCert(full))
      .catch(() => {});
  };

  // Descargar PDF
  const handleDownload = async (cert) => {
    setDownloadErr('');
    try {
      await certificateService.downloadCertificate(cert.id, cert.uuid);
    } catch {
      setDownloadErr('No se pudo descargar el PDF del certificado.');
    }
  };

  // Despues de revocar: cerrar modal y recargar
  const handleRevoked = () => {
    setViewCert(null);
    setSuccessMsg('Certificado revocado correctamente.');
    loadCertificates();
  };

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Certificados</h1>
      </div>

      {successMsg && (
        <Alert type="success" message={successMsg} dismissible style={{ marginBottom: '1rem' }} />
      )}
      {downloadErr && (
        <Alert type="error" message={downloadErr} dismissible style={{ marginBottom: '1rem' }} />
      )}

      {/* 25.04 - Filtros */}
      <div style={styles.filters}>
        <Select
          value={statusFilter}
          onChange={handleStatusFilter}
          options={STATUS_OPTIONS}
          placeholder="Todos los estados"
          style={{ width: '180px', marginBottom: 0 }}
        />
        <Select
          value={courseFilter}
          onChange={handleCourseFilter}
          options={allCourses.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Todos los cursos"
          style={{ width: '220px', marginBottom: 0 }}
        />
      </div>

      <CertificateList
        certificates={certificates}
        loading={loading}
        onView={handleView}
        onDownload={handleDownload}
      />

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      {/* Modal: Detalle del certificado */}
      <Modal
        isOpen={!!viewCert}
        onClose={() => setViewCert(null)}
        title="Detalle del Certificado"
        size="lg"
      >
        {viewCert && (
          <CertificateDetail
            certificate={viewCert}
            onClose={() => setViewCert(null)}
            onRevoked={handleRevoked}
          />
        )}
      </Modal>
    </div>
  );
};

const styles = {
  topBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:   { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' },
};

export default CertificatesPage;
