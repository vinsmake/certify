// Buscador de participantes para inscribir al curso (seleccion multiple).
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseApi, participantApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useApiMutation } from '../../../api/useApiMutation';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Table } from '../../../components/ui/Table';
import { plural } from '../../../lib/format';

interface EnrollModalProps {
  courseId: number;
  enrolledIds: Set<number>;
  open: boolean;
  onClose: () => void;
}

export const EnrollModal = ({ courseId, enrolledIds, open, onClose }: EnrollModalProps) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const params = { page: 1, limit: 50, search };
  const { data, isFetching } = useQuery({
    queryKey: keys.participants.list(params),
    queryFn: () => participantApi.list(params),
    enabled: open,
  });
  const candidates = (data?.data ?? []).filter((p) => !enrolledIds.has(p.id));

  const close = () => {
    setSelected(new Set());
    onClose();
  };

  const enroll = useApiMutation({
    mutationFn: (ids: number[]) => courseApi.enroll(courseId, ids),
    invalidate: [keys.courses.participants(courseId), keys.participants.all, keys.stats.all],
    success: (res) => `${plural(res.enrolled.length, 'participante inscrito', 'participantes inscritos')}.`,
    onSuccess: close,
  });

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Modal
      open={open}
      onClose={close}
      title="Inscribir participantes"
      size="lg"
      footer={
        <>
          <span className="muted grow">{selected.size} seleccionado(s)</span>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button disabled={!selected.size} loading={enroll.isPending} onClick={() => enroll.mutate([...selected])}>
            Inscribir
          </Button>
        </>
      }
    >
      <div className="stack">
        <SearchBar onSearch={setSearch} placeholder="Buscar participante por nombre..." />
        <Table
          rows={candidates}
          loading={isFetching}
          rowKey={(p) => p.id}
          onRowClick={(p) => toggle(p.id)}
          rowClassName={(p) => (selected.has(p.id) ? 'is-selected' : undefined)}
          empty={search ? 'Sin resultados (o ya estan inscritos).' : 'No hay participantes disponibles para inscribir.'}
          columns={[
            {
              key: 'check',
              header: '',
              render: (p) => <input type="checkbox" checked={selected.has(p.id)} readOnly aria-label={`Seleccionar ${p.full_name}`} />,
            },
            { key: 'name', header: 'Nombre', render: (p) => p.full_name },
            { key: 'dependency', header: 'Dependencia', render: (p) => p.dependency_name ?? 'Invitado' },
            { key: 'email', header: 'Correo', render: (p) => p.email ?? '—' },
          ]}
        />
        <p className="muted small">Se muestran hasta 50 resultados; usa la busqueda para encontrar a alguien en particular.</p>
      </div>
    </Modal>
  );
};
