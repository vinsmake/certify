// 22.01-22.04 - Dashboard con stats globales (admin) o por dependencia (emisor)

import React from 'react';
import useAuth from '../hooks/useAuth';
import useFetch from '../hooks/useFetch';
import Alert from '../components/ui/Alert';

// Tarjeta de resumen
const StatCard = ({ label, value, color = 'var(--color-primary)' }) => (
  <div style={styles.card}>
    <span style={{ ...styles.cardValue, color }}>{value ?? '—'}</span>
    <span style={styles.cardLabel}>{label}</span>
  </div>
);

// Fila de la tabla de desglose por dependencia
const DependencyRow = ({ dep }) => (
  <tr style={styles.tr}>
    <td style={styles.td}>{dep.name}</td>
    <td style={{ ...styles.td, ...styles.tdNum }}>{dep.total_courses}</td>
    <td style={{ ...styles.td, ...styles.tdNum }}>{dep.total_certificates}</td>
    <td style={{ ...styles.td, ...styles.tdNum, color: 'var(--color-success)' }}>
      {dep.certificates_valid}
    </td>
    <td style={{ ...styles.td, ...styles.tdNum, color: 'var(--color-danger)' }}>
      {dep.certificates_revoked}
    </td>
    <td style={{ ...styles.td, ...styles.tdNum }}>{dep.total_users}</td>
  </tr>
);

// Dashboard para admin: stats globales + desglose por dependencia
const AdminDashboard = () => {
  const { data, loading, error } = useFetch('/stats');

  if (loading) return <p style={styles.muted}>Cargando estadisticas...</p>;
  if (error)   return <Alert type="error" message={error} />;
  if (!data)   return null;

  const t = data.totals;

  return (
    <div>
      <h2 style={styles.sectionTitle}>Resumen global</h2>

      <div style={styles.cardGrid}>
        <StatCard label="Cursos"                  value={t.courses} />
        <StatCard label="Participantes"           value={t.participants} />
        <StatCard label="Certificados emitidos"   value={t.certificates} />
        <StatCard
          label="Validos"
          value={t.certificates_valid}
          color="var(--color-success)"
        />
        <StatCard
          label="Revocados"
          value={t.certificates_revoked}
          color="var(--color-danger)"
        />
      </div>

      {data.by_dependency?.length > 0 && (
        <>
          <h3 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>
            Desglose por dependencia
          </h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Dependencia</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Cursos</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Certificados</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Validos</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Revocados</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {data.by_dependency.map((dep) => (
                  <DependencyRow key={dep.id} dep={dep} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Dashboard para emisor: stats de su dependencia
const EmisorDashboard = () => {
  const { data, loading, error } = useFetch('/stats/me');

  if (loading) return <p style={styles.muted}>Cargando estadisticas...</p>;
  if (error)   return <Alert type="error" message={error} />;
  if (!data)   return null;

  const s = data.stats;

  return (
    <div>
      <h2 style={styles.sectionTitle}>
        {data.dependency?.name ?? 'Mi dependencia'}
      </h2>

      <div style={styles.cardGrid}>
        <StatCard label="Cursos"              value={s.total_courses} />
        <StatCard label="Participantes"       value={s.total_participants} />
        <StatCard label="Certificados"        value={s.total_certificates} />
        <StatCard
          label="Validos"
          value={s.certificates_valid}
          color="var(--color-success)"
        />
        <StatCard
          label="Revocados"
          value={s.certificates_revoked}
          color="var(--color-danger)"
        />
      </div>
    </div>
  );
};

// 22.01 - Pagina principal del dashboard
const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <p style={styles.muted}>
        Bienvenido, <strong>{user?.full_name}</strong>.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        {/* 22.02 - Admin: stats globales + desglose */}
        {/* 22.03 - Emisor: stats de su dependencia */}
        {/* 22.04 - Conectado a /api/stats o /api/stats/me segun rol */}
        {user?.role === 'admin' ? <AdminDashboard /> : <EmisorDashboard />}
      </div>
    </div>
  );
};

const styles = {
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    marginBottom: '0.25rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    marginBottom: '1rem',
  },
  muted: {
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '1rem',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    boxShadow: 'var(--shadow-sm)',
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: '700',
    lineHeight: 1,
  },
  cardLabel: {
    fontSize: '0.8125rem',
    color: 'var(--color-text-muted)',
    fontWeight: '500',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  thead: {
    backgroundColor: 'var(--color-surface-hover)',
    borderBottom: '1px solid var(--color-border)',
  },
  th: {
    padding: '0.75rem 1rem',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    fontSize: '0.8125rem',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid var(--color-border)',
  },
  td: {
    padding: '0.75rem 1rem',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle',
  },
  tdNum: {
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
};

export default DashboardPage;
