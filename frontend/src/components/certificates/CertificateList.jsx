// 25.03 - Tabla de certificados con columnas y acciones

import React from 'react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const CertificateList = ({ certificates, loading, onView, onDownload }) => {
  const columns = [
    {
      key: 'uuid',
      label: 'UUID',
      render: (v, row) => (
        <button onClick={() => onView(row)} style={styles.linkBtn} title={v}>
          {v ? v.substring(0, 8) + '...' : '—'}
        </button>
      ),
    },
    { key: 'participant_name', label: 'Participante' },
    { key: 'course_name',     label: 'Curso',       render: (v) => v || '—' },
    { key: 'dependency_name', label: 'Dependencia', render: (v) => v || '—' },
    { key: 'issue_date',      label: 'Fecha emision', render: (v) => formatDate(v) },
    { key: 'template_name',   label: 'Plantilla',  render: (v) => v || '—' },
    { key: 'status',          label: 'Estado',     render: (v) => <Badge status={v} /> },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div style={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => onView(row)}>Ver</Button>
          <Button size="sm" variant="ghost"     onClick={() => onDownload(row)}>PDF</Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={certificates}
      loading={loading}
      emptyText="No hay certificados para mostrar."
    />
  );
};

const styles = {
  linkBtn: {
    background: 'none', border: 'none', padding: 0,
    color: 'var(--color-primary)', cursor: 'pointer',
    fontSize: '0.875rem', fontWeight: '500', textAlign: 'left',
    fontFamily: 'monospace',
  },
  actions: { display: 'flex', gap: '0.375rem' },
};

export default CertificateList;
