// Pestaña Generar: emite certificados a los participantes que completaron el curso.
import { useState } from 'react';
import { Link } from 'react-router';
import type { EmitResponse } from '@certify/shared';
import { certificateApi } from '../../../api';
import { useTemplates } from '../../../api/queries';
import { useApiMutation } from '../../../api/useApiMutation';
import { CERTIFICATE_RELATED } from '../../../components/certificates/certificateActions';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Table } from '../../../components/ui/Table';
import { plural } from '../../../lib/format';
import type { CourseTabProps } from '../CoursePage';
import { useCourseParticipants } from './ParticipantsTab';

export const GenerateTab = ({ course }: CourseTabProps) => {
  const { data, isPending } = useCourseParticipants(course.id);
  const templates = useTemplates();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<EmitResponse | null>(null);

  const participants = data?.participants ?? [];
  const eligible = participants.filter((p) => p.attendance_status === 'completed' && p.certificate?.status !== 'valid');
  const notCompleted = participants.filter((p) => p.attendance_status !== 'completed').length;
  const nameOf = (id: number) => participants.find((p) => p.participant_id === id)?.full_name ?? `#${id}`;
  const templateName =
    course.template_name ?? templates.data?.find((t) => t.is_default)?.name ?? 'plantilla por defecto';

  const emit = useApiMutation({
    mutationFn: () => certificateApi.emit({ course_id: course.id, participant_ids: [...selected] }),
    invalidate: CERTIFICATE_RELATED,
    success: (res) => `${plural(res.emitted.length, 'certificado emitido', 'certificados emitidos')}.`,
    onSuccess: (res) => {
      setResult(res);
      setSelected(new Set());
      setConfirming(false);
    },
  });

  const allSelected = eligible.length > 0 && selected.size === eligible.length;
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="stack">
      <div className="card stack-sm">
        <p>
          Se emitira con el diseño <strong>{templateName}</strong> (<Link to={`/cursos/${course.id}/diseno`}>cambiar</Link>).
          Cada certificado lleva un QR unico a su pagina publica de verificacion.
        </p>
        <p className="small">
          Solo aparecen los participantes con asistencia <strong>Completado</strong> y sin certificado valido.
          {notCompleted > 0 && (
            <>
              {' '}
              Hay {plural(notCompleted, 'participante', 'participantes')} sin completar; marcalos en la pestaña{' '}
              <Link to={`/cursos/${course.id}/participantes`}>Participantes</Link>.
            </>
          )}
        </p>
      </div>

      {result && (
        <Alert type={result.errors.length ? 'warning' : 'success'} onClose={() => setResult(null)}>
          <div className="stack-sm">
            <span>
              Emitidos: {result.emitted.length}
              {result.already_exists.length > 0 && ` · Ya tenian certificado: ${result.already_exists.length}`}
            </span>
            {result.errors.map((e) => (
              <span key={e.participant_id}>
                {nameOf(e.participant_id)}: {e.reason}
              </span>
            ))}
            {result.emitted.length > 0 && (
              <Link to={`/cursos/${course.id}/certificados`}>Ver certificados emitidos</Link>
            )}
          </div>
        </Alert>
      )}

      <div className="row-between">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={!eligible.length}
            onChange={() => setSelected(allSelected ? new Set() : new Set(eligible.map((p) => p.participant_id)))}
          />
          Seleccionar todos ({eligible.length})
        </label>
        <Button disabled={!selected.size} onClick={() => setConfirming(true)}>
          Generar {plural(selected.size, 'certificado')}
        </Button>
      </div>

      <Table
        rows={eligible}
        loading={isPending}
        rowKey={(p) => p.participant_id}
        onRowClick={(p) => toggle(p.participant_id)}
        rowClassName={(p) => (selected.has(p.participant_id) ? 'is-selected' : undefined)}
        empty="No hay participantes pendientes de certificado."
        columns={[
          {
            key: 'check',
            header: '',
            render: (p) => <input type="checkbox" readOnly checked={selected.has(p.participant_id)} aria-label={`Seleccionar ${p.full_name}`} />,
          },
          { key: 'name', header: 'Nombre', render: (p) => p.full_name },
          { key: 'dependency', header: 'Dependencia', render: (p) => p.dependency_name ?? 'Invitado' },
          { key: 'email', header: 'Correo', render: (p) => p.email ?? '—' },
          {
            key: 'previous',
            header: 'Antecedente',
            render: (p) => (p.certificate?.status === 'revoked' ? <span className="small">Tuvo uno revocado</span> : '—'),
          },
        ]}
      />

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => emit.mutate()}
        loading={emit.isPending}
        title="Generar certificados"
        confirmLabel="Generar"
        variant="primary"
      >
        <p>
          Se generara un PDF para {plural(selected.size, 'participante', 'participantes')} de <strong>{course.name}</strong> con
          el diseño <strong>{templateName}</strong>.
        </p>
        <p className="small">Los certificados no se borran; si hay un error se pueden revocar o reimprimir.</p>
      </ConfirmDialog>
    </div>
  );
};
