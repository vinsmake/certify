// 28.03 - Tabla de dependencias con logo, estado y acciones

import React, { useRef } from 'react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const DependencyList = ({ dependencies, loading, onEdit, onDeactivate, onLogoUpload }) => {
  const fileInputRefs = useRef({});

  const handleFileClick = (id) => {
    if (!fileInputRefs.current[id]) return;
    fileInputRefs.current[id].click();
  };

  const columns = [
    {
      key: 'logo_path',
      label: 'Logo',
      render: (v, row) => v ? (
        <img
          src={`${BACKEND}${v}`}
          alt={row.name}
          style={styles.logo}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : <span style={styles.noLogo}>—</span>,
    },
    { key: 'name',         label: 'Nombre' },
    { key: 'abbreviation', label: 'Abreviatura', render: (v) => v || '—' },
    { key: 'is_active',    label: 'Estado',      render: (v) => <Badge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div style={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>Editar</Button>
          <Button size="sm" variant="ghost"     onClick={() => handleFileClick(row.id)}>
            Logo
          </Button>
          {row.is_active && (
            <Button size="sm" variant="danger" onClick={() => onDeactivate(row)}>Desactivar</Button>
          )}
          {/* Input oculto para subir logo */}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.svg,.webp"
            style={{ display: 'none' }}
            ref={(el) => { fileInputRefs.current[row.id] = el; }}
            onChange={(e) => {
              if (e.target.files[0]) {
                onLogoUpload(row.id, e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={dependencies}
      loading={loading}
      emptyText="No hay dependencias registradas."
    />
  );
};

const styles = {
  logo:    { height: '32px', width: 'auto', maxWidth: '64px', objectFit: 'contain', borderRadius: '3px' },
  noLogo:  { color: 'var(--color-text-muted)', fontSize: '0.875rem' },
  actions: { display: 'flex', gap: '0.375rem', flexWrap: 'wrap' },
};

export default DependencyList;
