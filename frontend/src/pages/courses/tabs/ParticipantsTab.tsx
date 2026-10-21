// Pestaña Participantes: inscripciones del curso, asistencia y estado del certificado de cada uno.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AttendanceStatus, Enrollment } from '@certify/shared';
import { courseApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useApiMutation } from '../../../api/useApiMutation';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Table } from '../../../components/ui/Table';
import { formatDate } from '../../../lib/format';
import type { CourseTabProps } from '../CoursePage';
import { EnrollModal } from './EnrollModal';

export const useCourseParticipants = (courseId: number) =>
  useQuery({ queryKey: keys.courses.participants(courseId), queryFn: () => courseApi.participants(courseId) });

export const ParticipantsTab = ({ course }: CourseTabProps) => {
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState<Enrollment | null>(null);
  const { data, isPending } = useCourseParticipants(course.id);
  const participants = data?.participants ?? [];
  const invalidate = [keys.courses.participants(course.id), keys.stats.all];

  const setAttendance = useApiMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: AttendanceStatus }) =>
      Promise.all(ids.map((pid) => courseApi.setAttendance(course.id, pid, status))),
    invalidate,
  });
  const unenroll = useApiMutation({
    mutationFn: (e: Enrollment) => courseApi.unenroll(course.id, e.participant_id),
    invalidate: [...invalidate, keys.participants.all],
    success: 'Participante dado de baja del curso.',
    onSuccess: () => setUnenrolling(null),
  });

  const pending = participants.filter((p) => p.attendance_status !== 'completed');
  const completed = participants.length - pending.length;
  const certified = participants.filter((p) => p.certificate?.status === 'valid').length;

  return (
    <div className="stack">
      <div className="row-between">
        <p className="muted">
          {participants.length} inscritos · {completed} completaron · {certified} con certificado valido
        </p>
        <div className="row">
          {pending.length > 0 && (
            <Button
              variant="secondary"
              loading={setAttendance.isPending}
              onClick={() => setAttendance.mutate({ ids: pending.map((p) => p.participant_id), status: 'completed' })}
            >
              Marcar todos como completados
            </Button>
          )}
          <Button onClick={() => setEnrolling(true)}>Inscribir participantes</Button>
        </div>
      </div>

      <Table
        rows={participants}
        loading={isPending}
        rowKey={(p) => p.participant_id}
        empty="Aun no hay participantes inscritos."
        columns={[
          { key: 'name', header: 'Nombre', render: (p) => p.full_name },
          { key: 'dependency', header: 'Dependencia', render: (p) => p.dependency_name ?? 'Invitado' },
          { key: 'enrolled', header: 'Inscripcion', render: (p) => formatDate(p.enrollment_date) },
          {
            key: 'attendance',
            header: 'Asistencia',
            render: (p) => (
              <select
                className="control control--sm"
                value={p.attendance_status}
                onChange={(e) =>
                  setAttendance.mutate({ ids: [p.participant_id], status: e.target.value as AttendanceStatus })
                }
              >
                <option value="enrolled">Inscrito</option>
                <option value="completed">Completado</option>
              </select>
            ),
          },
          {
            key: 'certificate',
            header: 'Certificado',
            render: (p) => (p.certificate ? <Badge status={p.certificate.status} /> : <span className="muted">Sin emitir</span>),
          },
          {
            key: 'actions',
            header: '',
            render: (p) =>
              p.certificate?.status !== 'valid' && (
                <Button size="sm" variant="ghost" onClick={() => setUnenrolling(p)}>
                  Dar de baja
                </Button>
              ),
          },
        ]}
      />

      <EnrollModal
        courseId={course.id}
        enrolledIds={new Set(participants.map((p) => p.participant_id))}
        open={enrolling}
        onClose={() => setEnrolling(false)}
      />

      <ConfirmDialog
        open={!!unenrolling}
        onClose={() => setUnenrolling(null)}
        onConfirm={() => unenrolling && unenroll.mutate(unenrolling)}
        loading={unenroll.isPending}
        title="Dar de baja"
        confirmLabel="Dar de baja"
      >
        <p>
          Se quitara a <strong>{unenrolling?.full_name}</strong> de este curso.
        </p>
      </ConfirmDialog>
    </div>
  );
};
