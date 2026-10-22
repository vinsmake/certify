import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { CertificateListItem, CertificateStatus } from '@certify/shared';
import { certificateApi } from '../api';
import { keys } from '../api/keys';
import { paginatedOptions, useCourseOptions } from '../api/queries';
import { CertificateDetailModal } from '../components/certificates/CertificateDetailModal';
import { downloadCertificate } from '../components/certificates/certificateActions';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Table } from '../components/ui/Table';
import { PAGE_SIZE } from '../config';
import { formatDate, shortUuid } from '../lib/format';
import { toast } from '../lib/toast';

const STATUS_OPTIONS = [
  { value: 'valid', label: 'Valido' },
  { value: 'revoked', label: 'Revocado' },
];

const CertificatesPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CertificateStatus | ''>('');
  const [courseId, setCourseId] = useState('');
  const [viewId, setViewId] = useState<number | null>(null);

  const courses = useCourseOptions();
  const params = { page, limit: PAGE_SIZE, status, course_id: courseId };
  const { data, isFetching } = useQuery({
    queryKey: keys.certificates.list(params),
    queryFn: () => certificateApi.list(params),
    ...paginatedOptions,
  });

  const download = (cert: CertificateListItem) =>
    downloadCertificate(cert).catch(() => toast.error('No se pudo descargar el PDF.'));

  return (
    <>
      <PageHeader title="Certificados" />

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
        <Select
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setPage(1);
          }}
          options={courses.data ?? []}
          placeholder="Todos los cursos"
        />
      </div>

      <Table
        rows={data?.data}
        loading={isFetching}
        rowKey={(c) => c.id}
        empty="No hay certificados para mostrar."
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
          { key: 'participant', header: 'Participante', render: (c) => c.participant_name },
          { key: 'course', header: 'Curso', render: (c) => <Link to={`/cursos/${c.course_id}`}>{c.course_name}</Link> },
          { key: 'dependency', header: 'Dependencia', render: (c) => c.dependency_name ?? '—' },
          { key: 'date', header: 'Emision', render: (c) => formatDate(c.issue_date) },
          { key: 'status', header: 'Estado', render: (c) => <Badge status={c.status} /> },
          {
            key: 'actions',
            header: '',
            render: (c) => (
              <div className="table__actions">
                <Button size="sm" variant="secondary" onClick={() => setViewId(c.id)}>
                  Ver
                </Button>
                <Button size="sm" variant="ghost" onClick={() => download(c)}>
                  PDF
                </Button>
              </div>
            ),
          },
        ]}
      />
      {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={setPage} />}

      <CertificateDetailModal certificateId={viewId} onClose={() => setViewId(null)} />
    </>
  );
};

export default CertificatesPage;
