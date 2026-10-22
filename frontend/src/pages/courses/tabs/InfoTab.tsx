// Pestaña Informacion: datos generales del curso, edicion y eliminacion.
// Todo lo que aparece en el certificado (diseño, logos, firmas, colaboradoras) esta en la pestaña Diseño.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { CreateCourseInput } from '@certify/shared';
import { courseApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useApiMutation } from '../../../api/useApiMutation';
import { CourseForm } from '../../../components/courses/CourseForm';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal';
import { courseTypeLabel, formatDate, formatDateTime } from '../../../lib/format';
import type { CourseTabProps } from '../CoursePage';

export const InfoTab = ({ course }: CourseTabProps) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const update = useApiMutation({
    mutationFn: (input: CreateCourseInput) => courseApi.update(course.id, input),
    invalidate: [keys.courses.all],
    success: 'Curso actualizado.',
    onSuccess: () => setEditing(false),
  });
  const remove = useApiMutation({
    mutationFn: () => courseApi.remove(course.id),
    invalidate: [keys.courses.all, keys.stats.all],
    success: 'Curso eliminado.',
    onSuccess: () => navigate('/cursos', { replace: true }),
  });

  return (
    <div className="stack">
      <div className="card stack">
        <div className="row-between">
          <h2>Datos del curso</h2>
          <div className="row">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleting(true)}>
              Eliminar
            </Button>
          </div>
        </div>
        <dl className="dl">
          <dt>Tipo</dt>
          <dd>{courseTypeLabel(course.type)}</dd>
          <dt>Descripcion</dt>
          <dd>{course.description || '—'}</dd>
          <dt>Duracion</dt>
          <dd>{course.duration_hours ? `${course.duration_hours} horas` : '—'}</dd>
          <dt>Instructor</dt>
          <dd>{course.instructor || '—'}</dd>
          <dt>Periodo</dt>
          <dd>
            {formatDate(course.start_date)} - {formatDate(course.end_date)}
          </dd>
          <dt>Colaboradoras</dt>
          <dd>{course.dependencies.map((d) => d.dependency_name).join(', ') || '—'}</dd>
          <dt>Creado por</dt>
          <dd>
            {course.created_by_name ?? '—'} ({formatDateTime(course.created_at)})
          </dd>
        </dl>
        <p className="small">
          El diseño del certificado, el logo, las firmas y las dependencias colaboradoras se editan en la pestaña{' '}
          <Link to={`/cursos/${course.id}/diseno`}>Diseño</Link>.
        </p>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar curso" size="lg">
        <CourseForm
          initial={course}
          onSubmit={(input) => update.mutate(input)}
          onCancel={() => setEditing(false)}
          loading={update.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="Eliminar curso"
        confirmLabel="Eliminar"
      >
        <p>
          Se eliminara el curso <strong>{course.name}</strong> con sus inscripciones. Un curso con certificados emitidos no se
          puede eliminar.
        </p>
      </ConfirmDialog>
    </div>
  );
};
