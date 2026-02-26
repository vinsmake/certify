// 23.03 - Tabla de cursos con columnas y acciones

import React from 'react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const TYPE_LABELS = {
  curso: 'Curso', taller: 'Taller', charla: 'Charla',
  seminario: 'Seminario', otro: 'Otro',
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const CourseList = ({ courses, loading, onView, onEdit, onDelete }) => {
  const columns = [
    { key: 'name', label: 'Nombre', render: (v, row) => (
      <button onClick={() => onView(row)} style={styles.linkBtn}>{v}</button>
    )},
    { key: 'type', label: 'Tipo', render: (v) => (
      <Badge status={v} label={TYPE_LABELS[v] || v} />
    )},
    { key: 'dependencies', label: 'Dependencias', render: (v) => {
      const list = Array.isArray(v) ? v : [];
      if (list.length === 0) return <span style={styles.noData}>—</span>;
      return (
        <div style={styles.depChips}>
          {list.map((d) => <span key={d.id} style={styles.depChip}>{d.name}</span>)}
        </div>
      );
    }},
    { key: 'duration_hours',  label: 'Horas',       render: (v) => v ? `${v}h` : '—' },
    { key: 'instructor',      label: 'Instructor',   render: (v) => v || '—' },
    { key: 'start_date',      label: 'Inicio',       render: (v) => formatDate(v) },
    { key: 'end_date',        label: 'Fin',          render: (v) => formatDate(v) },
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
      data={courses}
      loading={loading}
      emptyText="No hay cursos registrados."
    />
  );
};

const styles = {
  linkBtn: {
    background: 'none', border: 'none', padding: 0,
    color: 'var(--color-primary)', cursor: 'pointer',
    fontSize: '0.875rem', fontWeight: '500', textAlign: 'left',
  },
  actions:  { display: 'flex', gap: '0.375rem' },
  depChips: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem' },
  depChip:  {
    display: 'inline-block', padding: '0.125rem 0.5rem',
    borderRadius: '999px', fontSize: '0.75rem', fontWeight: '500',
    backgroundColor: 'var(--color-surface-hover)',
    color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)',
  },
  noData: { color: 'var(--color-text-muted)', fontSize: '0.875rem' },
};

export default CourseList;
