// 28.10 - Registro de actividad reciente del sistema (solo admin)

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const formatDate = (d) =>
  d ? new Date(d).toLocaleString('es', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const TYPE_LABELS = {
  certificate_emission: { label: 'Emision',        color: '#16a34a', bg: '#dcfce7' },
  revocation:           { label: 'Revocacion',      color: '#dc2626', bg: '#fee2e2' },
  course_creation:      { label: 'Curso creado',    color: '#2563eb', bg: '#dbeafe' },
  branding_change:      { label: 'Branding',        color: '#9333ea', bg: '#f3e8ff' },
};

const TypeBadge = ({ type }) => {
  const info = TYPE_LABELS[type] || { label: type, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{
      padding: '0.15rem 0.5rem', borderRadius: '999px',
      fontSize: '0.75rem', fontWeight: '600',
      color: info.color, backgroundColor: info.bg,
    }}>
      {info.label}
    </span>
  );
};

const ActivityLogPage = () => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/activity', { params: { limit: 100 } })
      .then((r) => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={styles.title}>Actividad del Sistema</h1>
      <p style={styles.sub}>Ultimos 100 eventos del sistema.</p>

      {loading ? (
        <p style={styles.empty}>Cargando...</p>
      ) : data.length === 0 ? (
        <p style={styles.empty}>No hay actividad registrada.</p>
      ) : (
        <div style={styles.list}>
          {data.map((item, i) => (
            <div key={i} style={styles.item}>
              <div style={styles.itemLeft}>
                <TypeBadge type={item.type} />
                <span style={styles.dateText}>{formatDate(item.event_at)}</span>
              </div>
              <div style={styles.itemRight}>
                <span style={styles.subject}>{item.subject || '—'}</span>
                {item.course_name && item.course_name !== item.subject && (
                  <span style={styles.meta}>{item.course_name}</span>
                )}
                {item.dependency_name && (
                  <span style={styles.dep}>{item.dependency_name}</span>
                )}
              </div>
              <div style={styles.itemUser}>
                <span style={styles.user}>{item.user_name || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  title:     { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' },
  sub:       { fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' },
  empty:     { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  list:      { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item:      {
    display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    padding: '0.625rem 1rem',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  },
  itemLeft:  { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '200px' },
  dateText:  { fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  itemRight: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  subject:   { fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)' },
  meta:      { fontSize: '0.8125rem', color: 'var(--color-text-secondary)' },
  dep:       { fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  itemUser:  { fontSize: '0.8125rem', color: 'var(--color-text-secondary)', minWidth: '140px', textAlign: 'right' },
  user:      {},
};

export default ActivityLogPage;
