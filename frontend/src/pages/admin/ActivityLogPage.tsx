import { useQuery } from '@tanstack/react-query';
import type { ActivityType } from '@certify/shared';
import { adminApi } from '../../api';
import { keys } from '../../api/keys';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { formatDateTime } from '../../lib/format';

const TYPES: Record<ActivityType, { label: string; tone: 'success' | 'danger' | 'info' | 'purple' | 'warning' }> = {
  certificate_emission: { label: 'Emision', tone: 'success' },
  certificate_reprint: { label: 'Reimpresion', tone: 'warning' },
  revocation: { label: 'Revocacion', tone: 'danger' },
  course_creation: { label: 'Curso creado', tone: 'info' },
  branding_change: { label: 'Branding', tone: 'purple' },
};

const LIMIT = 100;

const ActivityLogPage = () => {
  const { data, isPending } = useQuery({ queryKey: keys.admin.activity, queryFn: () => adminApi.activity(LIMIT) });

  return (
    <>
      <PageHeader title="Actividad del sistema" subtitle={`Ultimos ${LIMIT} eventos.`} />
      <Table
        rows={data?.data}
        loading={isPending}
        rowKey={(a) => `${a.type}-${a.reference}-${a.event_at}`}
        empty="No hay actividad registrada."
        columns={[
          { key: 'type', header: 'Tipo', render: (a) => <Badge tone={TYPES[a.type].tone}>{TYPES[a.type].label}</Badge> },
          { key: 'date', header: 'Fecha', render: (a) => <span className="nowrap">{formatDateTime(a.event_at)}</span> },
          {
            key: 'subject',
            header: 'Detalle',
            render: (a) => (
              <div className="stack-sm" style={{ gap: 0 }}>
                <span>{a.subject ?? '—'}</span>
                {a.course_name && a.course_name !== a.subject && <span className="muted small">{a.course_name}</span>}
              </div>
            ),
          },
          { key: 'dependency', header: 'Dependencia', render: (a) => a.dependency_name ?? '—' },
          { key: 'user', header: 'Usuario', render: (a) => a.user_name ?? '—' },
        ]}
      />
    </>
  );
};

export default ActivityLogPage;
