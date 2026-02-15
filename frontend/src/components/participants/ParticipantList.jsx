// 24.03 - Tabla de participantes con columnas y acciones

import React from 'react';
import Table from '../ui/Table';
import Button from '../ui/Button';

const ParticipantList = ({ participants, loading, onView, onEdit, onDelete }) => {
  const columns = [
    { key: 'document_id', label: 'Cedula' },
    { key: 'full_name',   label: 'Nombre', render: (v, row) => (
      <button onClick={() => onView(row)} style={styles.linkBtn}>{v}</button>
    )},
    { key: 'email',        label: 'Correo',       render: (v) => v || '—' },
    { key: 'organization', label: 'Organizacion', render: (v) => v || '—' },
    { key: 'position',     label: 'Cargo',        render: (v) => v || '—' },
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
  actions: { display: 'flex', gap: '0.375rem' },
};

export default ParticipantList;
