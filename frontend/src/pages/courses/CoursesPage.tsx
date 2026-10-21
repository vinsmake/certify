import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import type { CourseType, CreateCourseInput } from '@certify/shared';
import { courseApi } from '../../api';
import { keys } from '../../api/keys';
import { paginatedOptions } from '../../api/queries';
import { useApiMutation } from '../../api/useApiMutation';
import { CourseForm } from '../../components/courses/CourseForm';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { SearchBar } from '../../components/ui/SearchBar';
import { Table } from '../../components/ui/Table';
import { PAGE_SIZE } from '../../config';
import { courseTypeLabel, courseTypeOptions, formatDate } from '../../lib/format';

const CoursesPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<CourseType | ''>('');
  const [creating, setCreating] = useState(false);

  const params = { page, limit: PAGE_SIZE, search, type };
  const { data, isFetching } = useQuery({
    queryKey: keys.courses.list(params),
    queryFn: () => courseApi.list(params),
    ...paginatedOptions,
  });

  const create = useApiMutation({
    mutationFn: (input: CreateCourseInput) => courseApi.create(input),
    invalidate: [keys.courses.all, keys.stats.all],
    success: 'Curso creado.',
    // Al crear, se abre la pagina del curso para inscribir participantes
    onSuccess: (course) => navigate(`/cursos/${course.id}/participantes`),
  });

  return (
    <>
      <PageHeader title="Cursos" actions={<Button onClick={() => setCreating(true)}>Nuevo curso</Button>} />

      <div className="filters">
        <SearchBar
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Buscar por nombre..."
        />
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
        rowKey={(c) => c.id}
        empty="No hay cursos registrados."
        columns={[
          { key: 'name', header: 'Nombre', render: (c) => <Link to={`/cursos/${c.id}`}>{c.name}</Link> },
          { key: 'type', header: 'Tipo', render: (c) => <Badge>{courseTypeLabel(c.type)}</Badge> },
          {
            key: 'deps',
            header: 'Dependencias',
            render: (c) =>
              c.dependencies.length ? (
                <div className="chips">
                  {c.dependencies.map((d) => (
                    <span key={d.id} className="chip">
                      {d.name}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              ),
          },
          { key: 'template', header: 'Diseño', render: (c) => c.template_name ?? <span className="muted">Por defecto</span> },
          { key: 'hours', header: 'Horas', render: (c) => (c.duration_hours ? `${c.duration_hours} h` : '—') },
          { key: 'start', header: 'Inicio', render: (c) => formatDate(c.start_date) },
          { key: 'end', header: 'Fin', render: (c) => formatDate(c.end_date) },
        ]}
      />
      {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={setPage} />}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo curso" size="lg">
        <CourseForm onSubmit={(input) => create.mutate(input)} onCancel={() => setCreating(false)} loading={create.isPending} />
      </Modal>
    </>
  );
};

export default CoursesPage;
