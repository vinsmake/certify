import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { CourseType } from '@certify/shared';
import { adminApi } from '../../api';
import { keys } from '../../api/keys';
import { paginatedOptions } from '../../api/queries';
import { Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Table } from '../../components/ui/Table';
import { PAGE_SIZE } from '../../config';
import { courseTypeLabel, courseTypeOptions, formatDate } from '../../lib/format';

/** Cursos de todas las dependencias con conteo de participantes y certificados. */
const GlobalEventsPage = () => {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<CourseType | ''>('');
  const params = { page, limit: PAGE_SIZE, type };
  const { data, isFetching } = useQuery({
    queryKey: keys.admin.events(params),
    queryFn: () => adminApi.events(params),
    ...paginatedOptions,
  });

  return (
    <>
      <PageHeader title="Eventos globales" />
      <div className="filters">
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as CourseType | '');
            setPage(1);
          }}
          options={courseTypeOptions}
          placeholder="Todos los tipos"
        />
      </div>
      <Table
        rows={data?.data}
        loading={isFetching}
        rowKey={(e) => e.id}
        empty="No hay cursos registrados."
        columns={[
          { key: 'name', header: 'Curso', render: (e) => <Link to={`/cursos/${e.id}`}>{e.name}</Link> },
          { key: 'type', header: 'Tipo', render: (e) => courseTypeLabel(e.type) },
          { key: 'dependency', header: 'Dependencia', render: (e) => e.dependency_name ?? '—' },
          { key: 'hours', header: 'Horas', render: (e) => (e.duration_hours ? `${e.duration_hours} h` : '—') },
          { key: 'instructor', header: 'Instructor', render: (e) => e.instructor ?? '—' },
          { key: 'start', header: 'Inicio', render: (e) => formatDate(e.start_date) },
          { key: 'end', header: 'Fin', render: (e) => formatDate(e.end_date) },
          { key: 'participants', header: 'Participantes', className: 'num', render: (e) => e.participant_count },
          { key: 'certificates', header: 'Certificados', className: 'num', render: (e) => e.certificates_issued },
        ]}
      />
      {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={setPage} />}
    </>
  );
};

export default GlobalEventsPage;
