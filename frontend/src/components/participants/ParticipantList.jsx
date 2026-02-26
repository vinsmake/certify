// 24.03 - Tabla de participantes con columnas y acciones

import React from 'react';
import Table from '../ui/Table';
import Button from '../ui/Button';

const ParticipantList = ({ participants, loading, onView, onEdit, onDelete }) => {
  const columns = [
    { key: 'full_name',   label: 'Nombre', render: (v, row) => (
      <button onClick={() => onView(row)} style={styles.linkBtn}>{v}</button>
    )},
    { key: 'dependency_name', label: 'Dependencia', render: (v) => v || <span style={styles.guestBadge}>Invitado</span> },
    { key: 'email',           label: 'Correo',      render: (v) => v || '—' },
    { key: 'actions', label: 'Acciones', render: (_, row) => (
      <div style={styles.actions}>
        <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>Editar</Button>
        <Button size="sm" variant="danger"    onClick={() => onDelete(row)}>Eliminar</Button>
      </div>
    )},
  ];

  return (
    <Table
      columns={columns}
      data={participants}
      loading={loading}
      emptyText="No hay participantes registrados."
    />
  );
};

const styles = {
  linkBtn: {
    background: 'none', border: 'none', padding: 0,
    color: 'var(--color-primary)', cursor: 'pointer',
    fontSize: '0.875rem', fontWeight: '500', textAlign: 'left',
  },
  actions:    { display: 'flex', gap: '0.375rem' },
  guestBadge: {
    display: 'inline-block', padding: '0.125rem 0.5rem',
    borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600',
    backgroundColor: 'var(--color-surface-hover)',
    color: 'var(--color-text-muted)', border: '1px solid var(--color-border)',
  },
};

export default ParticipantList;
