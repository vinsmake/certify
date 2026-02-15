// 28.05 - Tabla de plantillas con estado, default y acciones

import React from 'react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const TemplateList = ({ templates, loading, onEdit, onDeactivate, onSetDefault, onPreview }) => {
  const columns = [
    { key: 'name',        label: 'Nombre' },
    { key: 'slug',        label: 'Slug',        render: (v) => <code style={styles.code}>{v}</code> },
    { key: 'orientation', label: 'Orientacion', render: (v) => v || '—' },
    { key: 'page_size',   label: 'Tamano',      render: (v) => v || '—' },
    {
      key: 'is_default',
      label: 'Default',
      render: (v) => v ? <Badge status="active" /> : <span style={styles.dash}>—</span>,
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (v) => <Badge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div style={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>Editar</Button>
          <Button size="sm" variant="ghost"     onClick={() => onPreview(row)}>Preview</Button>
          {!row.is_default && row.is_active && (
            <Button size="sm" variant="ghost" onClick={() => onSetDefault(row)}>Set default</Button>
          )}
          {row.is_active && (
            <Button size="sm" variant="danger" onClick={() => onDeactivate(row)}>Desactivar</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={templates}
      loading={loading}
      emptyText="No hay plantillas registradas."
    />
  );
};

const styles = {
  code:    { fontSize: '0.75rem', fontFamily: 'monospace', backgroundColor: 'var(--color-surface-hover)', padding: '0.1rem 0.375rem', borderRadius: '3px' },
  dash:    { color: 'var(--color-text-muted)' },
  actions: { display: 'flex', gap: '0.375rem', flexWrap: 'wrap' },
};

export default TemplateList;
