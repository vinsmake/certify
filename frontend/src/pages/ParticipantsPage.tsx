import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type { CreateParticipantInput, Participant } from '@certify/shared';
import { participantApi } from '../api';
import { keys } from '../api/keys';
import { paginatedOptions, useCourseOptions, useDependencies, useTags } from '../api/queries';
import { useApiMutation } from '../api/useApiMutation';
import { useCurrentUser } from '../auth/useAuth';
import { ParticipantForm } from '../components/participants/ParticipantForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { SearchBar } from '../components/ui/SearchBar';
import { Spinner } from '../components/ui/Spinner';
import { Table } from '../components/ui/Table';
import { PAGE_SIZE } from '../config';
import { formatDate } from '../lib/format';

const ParticipantCertificates = ({ participant }: { participant: Participant }) => {
  const { data, isPending } = useQuery({
    queryKey: keys.participants.certificates(participant.id),
    queryFn: () => participantApi.certificates(participant.id),
  });

  return (
    <div className="stack">
      <dl className="dl">
        <dt>Dependencia</dt>
        <dd>{participant.dependency_name ?? 'Invitado'}</dd>
        <dt>Correo</dt>
        <dd>{participant.email ?? '—'}</dd>
      </dl>
      <section className="section">
        <h3 className="section__title">Historial de certificados</h3>
        {isPending ? (
          <Spinner />
        ) : (
          <Table
            rows={data?.certificates}
            rowKey={(c) => c.id}
            empty="Este participante no tiene certificados emitidos."
            columns={[
              { key: 'course', header: 'Curso', render: (c) => <Link to={`/cursos/${c.course_id}`}>{c.course_name}</Link> },
              { key: 'date', header: 'Emision', render: (c) => formatDate(c.issue_date) },
              { key: 'status', header: 'Estado', render: (c) => <Badge status={c.status} /> },
            ]}
          />
        )}
      </section>
    </div>
  );
};

const ParticipantsPage = () => {
  const { isAdmin } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', dependency_id: '', course_id: '', tag_id: '' });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [viewing, setViewing] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState<Participant | null>(null);

  const deps = useDependencies(true, isAdmin);
  const courses = useCourseOptions();
  const tags = useTags();

  const params = { page, limit: PAGE_SIZE, ...filters };
  const { data, isFetching } = useQuery({
    queryKey: keys.participants.list(params),
    queryFn: () => participantApi.list(params),
    ...paginatedOptions,
  });

  const setFilter = (name: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };
  const hasFilters = !!(filters.dependency_id || filters.course_id || filters.tag_id);

  const save = useApiMutation({
    mutationFn: (input: CreateParticipantInput) =>
      editing ? participantApi.update(editing.id, input) : participantApi.create(input),
    invalidate: [keys.participants.all, keys.stats.all],
    success: () => (editing ? 'Participante actualizado.' : 'Participante creado.'),
    onSuccess: () => {
      setCreating(false);
      setEditing(null);
    },
  });

  const remove = useApiMutation({
    mutationFn: (p: Participant) => participantApi.remove(p.id),
    invalidate: [keys.participants.all, keys.stats.all, keys.courses.all],
    success: 'Participante eliminado.',
    onSuccess: () => setDeleting(null),
  });

  return (
    <>
      <PageHeader title="Participantes" actions={<Button onClick={() => setCreating(true)}>Nuevo participante</Button>} />

      <div className="filters">
        <SearchBar onSearch={(v) => setFilter('search', v)} placeholder="Buscar por nombre..." />
        {isAdmin && (
          <Select
            value={filters.dependency_id}
            onChange={(e) => setFilter('dependency_id', e.target.value)}
            options={(deps.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Todas las dependencias"
          />
        )}
        <Select
          value={filters.course_id}
          onChange={(e) => setFilter('course_id', e.target.value)}
          options={courses.data ?? []}
          placeholder="Todos los cursos"
        />
        <Select
          value={filters.tag_id}
          onChange={(e) => setFilter('tag_id', e.target.value)}
          options={(tags.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Todos los tags"
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters((prev) => ({ ...prev, dependency_id: '', course_id: '', tag_id: '' }));
              setPage(1);
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <Table
        rows={data?.data}
        loading={isFetching}
        rowKey={(p) => p.id}
        empty="No hay participantes registrados."
        columns={[
          {
            key: 'name',
            header: 'Nombre',
            render: (p) => (
              <button className="btn btn--link" onClick={() => setViewing(p)}>
                {p.full_name}
              </button>
            ),
          },
          { key: 'dependency', header: 'Dependencia', render: (p) => p.dependency_name ?? <span className="chip">Invitado</span> },
          {
            key: 'tags',
            header: 'Tags',
            render: (p) =>
              p.tags.length ? (
                <div className="chips">
                  {p.tags.map((t) => (
                    <span key={t.id} className="chip chip--primary">
                      {t.name}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              ),
          },
          { key: 'email', header: 'Correo', render: (p) => p.email ?? '—' },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <div className="table__actions">
                <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                  Editar
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleting(p)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />
      {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={setPage} />}

      <Modal
        open={creating || !!editing}
        onClose={() => (setCreating(false), setEditing(null))}
        title={editing ? 'Editar participante' : 'Nuevo participante'}
      >
        <ParticipantForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onSubmit={(input) => save.mutate(input)}
          onCancel={() => (setCreating(false), setEditing(null))}
          loading={save.isPending}
        />
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.full_name} size="lg">
        {viewing && <ParticipantCertificates participant={viewing} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        loading={remove.isPending}
        title="Eliminar participante"
        confirmLabel="Eliminar"
      >
        <p>
          Se eliminara a <strong>{deleting?.full_name}</strong> y sus inscripciones. Esta accion no se puede deshacer.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default ParticipantsPage;
