// 28.09 - Lista global de certificados de todas las dependencias (solo admin)

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';

const STATUS_OPTIONS = [
  { value: 'valid',   label: 'Valido'   },
  { value: 'revoked', label: 'Revocado' },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const columns = [
  { key: 'uuid',             label: 'UUID',         render: (v) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{v?.substring(0,8)}...</span> },
  { key: 'participant_name', label: 'Participante'  },
  { key: 'document_id',      label: 'Cedula'        },
  { key: 'course_name',      label: 'Curso',        render: (v) => v || '—' },
  { key: 'dependency_name',  label: 'Dependencia',  render: (v) => v || '—' },
  { key: 'template_name',    label: 'Plantilla',    render: (v) => v || '—' },
  { key: 'issue_date',       label: 'Emision',      render: (v) => formatDate(v) },
  { key: 'issued_by_name',   label: 'Emitido por',  render: (v) => v || '—' },
  { key: 'status',           label: 'Estado',       render: (v) => <Badge status={v} /> },
];

const GlobalCertificatesPage = () => {
  const [data,          setData]          = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [statusFilter,  setStatusFilter]  = useState('');
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/certificates', { params: { page, limit: LIMIT, status: statusFilter || undefined } })
      .then((r) => { setData(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={styles.title}>Certificados Global</h1>

      <div style={styles.filters}>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={STATUS_OPTIONS}
          placeholder="Todos los estados"
          style={{ width: '180px', marginBottom: 0 }}
        />
      </div>

      <Table columns={columns} data={data} loading={loading} emptyText="No hay certificados registrados." />
      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
    </div>
  );
};

const styles = {
  title:   { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '1.25rem' },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' },
};

export default GlobalCertificatesPage;
