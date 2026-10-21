import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api';
import { keys } from '../api/keys';
import { useCurrentUser } from '../auth/useAuth';
import { Alert } from '../components/ui/Alert';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';
import { Table } from '../components/ui/Table';
import { errorMessage } from '../lib/http';

interface StatProps {
  label: string;
  value: number;
  tone?: 'success' | 'danger';
}

const Stat = ({ label, value, tone }: StatProps) => (
  <div className="card stat">
    <span className={`stat__value${tone ? ` text-${tone}` : ''}`}>{value}</span>
    <span className="stat__label">{label}</span>
  </div>
);

const AdminDashboard = () => {
  const { data, isPending, error } = useQuery({ queryKey: [...keys.stats.all, 'global'], queryFn: statsApi.global });
  if (isPending) return <Spinner />;
  if (error) return <Alert type="error">{errorMessage(error)}</Alert>;
  const t = data.totals;

  return (
    <div className="stack">
      <h2>Resumen global</h2>
      <div className="stat-grid">
        <Stat label="Cursos" value={t.courses} />
        <Stat label="Participantes" value={t.participants} />
        <Stat label="Certificados emitidos" value={t.certificates} />
        <Stat label="Validos" value={t.certificates_valid} tone="success" />
        <Stat label="Revocados" value={t.certificates_revoked} tone="danger" />
      </div>

      {data.by_dependency.length > 0 && (
        <>
          <h2>Desglose por dependencia</h2>
          <Table
            rows={data.by_dependency}
            rowKey={(d) => d.id}
            columns={[
              { key: 'name', header: 'Dependencia', render: (d) => d.name },
              { key: 'courses', header: 'Cursos', className: 'num', render: (d) => d.total_courses },
              { key: 'certs', header: 'Certificados', className: 'num', render: (d) => d.total_certificates },
              {
                key: 'valid',
                header: 'Validos',
                className: 'num',
                render: (d) => <span className="text-success">{d.certificates_valid}</span>,
              },
              {
                key: 'revoked',
                header: 'Revocados',
                className: 'num',
                render: (d) => <span className="text-danger">{d.certificates_revoked}</span>,
              },
              { key: 'users', header: 'Usuarios', className: 'num', render: (d) => d.total_users ?? 0 },
            ]}
          />
        </>
      )}
    </div>
  );
};

const DependencyDashboard = () => {
  const { data, isPending, error } = useQuery({ queryKey: [...keys.stats.all, 'me'], queryFn: statsApi.mine });
  if (isPending) return <Spinner />;
  if (error) return <Alert type="error">{errorMessage(error)}</Alert>;
  const s = data.stats;

  return (
    <div className="stack">
      <h2>{data.dependency.name}</h2>
      <div className="stat-grid">
        <Stat label="Cursos" value={s.total_courses} />
        <Stat label="Participantes" value={s.total_participants} />
        <Stat label="Certificados" value={s.total_certificates} />
        <Stat label="Validos" value={s.certificates_valid} tone="success" />
        <Stat label="Revocados" value={s.certificates_revoked} tone="danger" />
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, isAdmin } = useCurrentUser();
  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Bienvenido, ${user.full_name}.`} />
      {isAdmin ? <AdminDashboard /> : <DependencyDashboard />}
    </>
  );
};

export default DashboardPage;
