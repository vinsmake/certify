import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { CertificateStatus } from '@certify/shared';
import { adminApi } from '../../api';
import { keys } from '../../api/keys';
import { paginatedOptions } from '../../api/queries';
import { CertificateDetailModal } from '../../components/certificates/CertificateDetailModal';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Table } from '../../components/ui/Table';
import { PAGE_SIZE } from '../../config';
import { formatDate, shortUuid } from '../../lib/format';

const STATUS_OPTIONS = [
  { value: 'valid', label: 'Valido' },
  { value: 'revoked', label: 'Revocado' },
];

/** Certificados de todas las dependencias. */
const GlobalCertificatesPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CertificateStatus | ''>('');
  const [viewId, setViewId] = useState<number | null>(null);
  const params = { page, limit: PAGE_SIZE, status };
  const { data, isFetching } = useQuery({
    queryKey: keys.admin.certificates(params),
    queryFn: () => adminApi.certificates(params),
    ...paginatedOptions,
  });

  return (
    <>
      <PageHeader title="Certificados global" />
      <div className="filters">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CertificateStatus | '');
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="Todos los estados"
        />
      </div>
      <Table
        rows={data?.data}
        loading={isFetching}
        rowKey={(c) => c.id}
        empty="No hay certificados registrados."
        columns={[
          {
            key: 'uuid',
            header: 'UUID',
            render: (c) => (
              <button className="btn btn--link mono" title={c.uuid} onClick={() => setViewId(c.id)}>
                {shortUuid(c.uuid)}
              </button>
            ),
          },
          { key: 'participant', header: 'Participante', render: (c) => c.participant_name ?? '—' },
          { key: 'course', header: 'Curso', render: (c) => <Link to={`/cursos/${c.course_id}`}>{c.course_name}</Link> },
          { key: 'dependency', header: 'Dependencia', render: (c) => c.dependency_name ?? '—' },
          { key: 'template', header: 'Plantilla', render: (c) => c.template_name ?? '—' },
          { key: 'date', header: 'Emision', render: (c) => formatDate(c.issue_date) },
          { key: 'issuer', header: 'Emitido por', render: (c) => c.issued_by_name ?? '—' },
          { key: 'reprints', header: 'Reimpr.', className: 'num', render: (c) => c.reprint_count },
          { key: 'status', header: 'Estado', render: (c) => <Badge status={c.status} /> },
        ]}
      />
      {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={setPage} />}
      <CertificateDetailModal certificateId={viewId} onClose={() => setViewId(null)} />
    </>
  );
};

export default GlobalCertificatesPage;
