import React, { useRef } from 'react';
import Table from '../ui/Table';
import Button from '../ui/Button';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

const TagList = ({ tags, loading, onEdit, onDelete, onLogoUpload }) => {
  const logoInputRefs = useRef({});

  const handleLogoClick = (id) => {
    if (!logoInputRefs.current[id]) return;
    logoInputRefs.current[id].click();
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
    { key: 'name', label: 'Nombre' },
    {
      key: 'slug',
      label: 'Slug',
      render: (v) => <code style={styles.slug}>{v}</code>,
    },
    {
      key: 'description',
      label: 'Descripcion',
      render: (v) => v || '—',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div style={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => handleLogoClick(row.id)}>Logo</Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(row)}>Eliminar</Button>

          {/* Input oculto para subir logo */}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.svg,.webp"
            style={{ display: 'none' }}
            ref={(el) => { logoInputRefs.current[row.id] = el; }}
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
      data={tags}
      loading={loading}
      emptyText="No hay tags registrados."
    />
  );
};

const styles = {
  logo:    { height: '32px', width: 'auto', maxWidth: '64px', objectFit: 'contain', borderRadius: '3px' },
  noLogo:  { color: 'var(--color-text-muted)', fontSize: '0.875rem' },
  slug:    { fontSize: '0.8125rem', backgroundColor: 'var(--color-surface-hover)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' },
  actions: { display: 'flex', gap: '0.375rem', flexWrap: 'wrap' },
};

export default TagList;
