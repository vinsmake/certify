// 24.10-24.11 - Vista detallada de un participante con historial de certificados

import React, { useEffect, useState } from 'react';
import participantService from '../../services/participantService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const ParticipantDetail = ({ participant, onClose }) => {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    participantService.getParticipantCertificates(participant.id)
      .then((data) => setCerts(Array.isArray(data) ? data : []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, [participant.id]);

  return (
    <div style={styles.container}>
      {/* Datos del participante */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{participant.full_name}</h2>
          <p style={styles.meta}>
            Dependencia:{' '}
            {participant.dependency_name
              ? participant.dependency_name
              : <span style={styles.guestBadge}>Invitado</span>}
          </p>
          {participant.email           && <p style={styles.meta}>Correo: {participant.email}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </div>

      {/* 24.11 - Historial de certificados */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Historial de certificados</h3>

        {loading ? (
          <p style={styles.empty}>Cargando...</p>
        ) : certs.length === 0 ? (
          <p style={styles.empty}>Este participante no tiene certificados emitidos.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Curso</th>
                  <th style={styles.th}>Fecha de emision</th>
                  <th style={styles.th}>Plantilla</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={styles.td}>{c.course_name || '—'}</td>
                    <td style={styles.td}>{formatDate(c.issue_date)}</td>
                    <td style={styles.td}>{c.template_name || '—'}</td>
                    <td style={styles.td}><Badge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container:    { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  title:        { fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' },
  meta:         { fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 },
  guestBadge:   {
    display: 'inline-block', padding: '0.125rem 0.5rem',
    borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600',
    backgroundColor: 'var(--color-surface-hover)',
    color: 'var(--color-text-muted)', border: '1px solid var(--color-border)',
  },
  section:      { borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' },
  sectionTitle: { fontSize: '0.9375rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' },
  empty:        { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  tableWrapper: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  thead:        { backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' },
  th:           { padding: '0.625rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textAlign: 'left' },
  tr:           { borderBottom: '1px solid var(--color-border)' },
  td:           { padding: '0.625rem 1rem', color: 'var(--color-text-primary)' },
};

export default ParticipantDetail;
