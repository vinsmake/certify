// Pestaña Informacion: datos del curso, firma del instructor y dependencias colaboradoras.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { CreateCourseInput } from '@certify/shared';
import { courseApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useDependencies } from '../../../api/queries';
import { useApiMutation } from '../../../api/useApiMutation';
import { useCurrentUser } from '../../../auth/useAuth';
import { CourseForm } from '../../../components/courses/CourseForm';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Select } from '../../../components/ui/Field';
import { FileButton } from '../../../components/ui/FileButton';
import { Modal } from '../../../components/ui/Modal';
import { StoredImage } from '../../../components/ui/StoredImage';
import { courseTypeLabel, formatDate, formatDateTime } from '../../../lib/format';
import type { CourseTabProps } from '../CoursePage';

export const InfoTab = ({ course }: CourseTabProps) => {
  const { isAdmin } = useCurrentUser();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deps = useDependencies(true, isAdmin);
  const invalidate = [keys.courses.all];

  const update = useApiMutation({
    mutationFn: (input: CreateCourseInput) => courseApi.update(course.id, input),
    invalidate,
    success: 'Curso actualizado.',
    onSuccess: () => setEditing(false),
  });
  const remove = useApiMutation({
    mutationFn: () => courseApi.remove(course.id),
    invalidate: [keys.courses.all, keys.stats.all],
    success: 'Curso eliminado.',
    onSuccess: () => navigate('/cursos', { replace: true }),
  });
  const uploadSignature = useApiMutation({
    mutationFn: (file: File) => courseApi.uploadSignature(course.id, file),
    invalidate,
    success: 'Firma actualizada.',
  });
  const deleteSignature = useApiMutation({
    mutationFn: () => courseApi.deleteSignature(course.id),
    invalidate,
    success: 'Firma eliminada.',
  });
  const addDependency = useApiMutation({
    mutationFn: (dependencyId: number) => courseApi.addDependency(course.id, dependencyId),
    invalidate,
    success: 'Dependencia agregada.',
  });
  const removeDependency = useApiMutation({
    mutationFn: (dependencyId: number) => courseApi.removeDependency(course.id, dependencyId),
    invalidate,
    success: 'Dependencia removida.',
  });

  const linked = new Set(course.dependencies.map((d) => d.dependency_id));
  const available = (deps.data ?? []).filter((d) => !linked.has(d.id));

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
          <dt>Diseño de certificado</dt>
          <dd>{course.template_name ?? 'Plantilla por defecto'}</dd>
          <dt>Creado por</dt>
          <dd>
            {course.created_by_name ?? '—'} ({formatDateTime(course.created_at)})
          </dd>
        </dl>
      </div>

      <div className="card stack-sm">
        <h2>Firma del instructor</h2>
        <p className="small">Aparece en el certificado si la plantilla incluye la firma del instructor.</p>
        <div className="row">
          <StoredImage path={course.signature_path} alt="Firma del instructor" className="table__img" />
          <FileButton onSelect={(file) => uploadSignature.mutate(file)} loading={uploadSignature.isPending}>
            {course.signature_path ? 'Cambiar firma' : 'Subir firma'}
          </FileButton>
          {course.signature_path && (
            <Button variant="ghost" size="sm" onClick={() => deleteSignature.mutate()} loading={deleteSignature.isPending}>
              Quitar firma
            </Button>
          )}
        </div>
      </div>

      <div className="card stack-sm">
        <h2>Dependencias colaboradoras</h2>
        <p className="small">Sus logos y firmas de encargado aparecen en el certificado.</p>
        {course.dependencies.length ? (
          <div className="chips">
            {course.dependencies.map((d) => (
              <span key={d.dependency_id} className="chip chip--soft">
                {d.dependency_name}
                {isAdmin && (
                  <button className="chip__remove" title="Quitar" onClick={() => removeDependency.mutate(d.dependency_id)}>
                    &times;
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">Sin dependencias colaboradoras.</p>
        )}
        {isAdmin && available.length > 0 && (
          <Select
            value=""
            onChange={(e) => e.target.value && addDependency.mutate(Number(e.target.value))}
            options={available.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Agregar dependencia..."
            fieldClassName="grow"
          />
        )}
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
