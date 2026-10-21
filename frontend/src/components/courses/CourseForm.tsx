import { useState, type FormEvent } from 'react';
import { createCourseSchema, type Course, type CreateCourseInput } from '@certify/shared';
import { useDependencies, useTemplates } from '../../api/queries';
import { useCurrentUser } from '../../auth/useAuth';
import { courseTypeOptions, toDateInput } from '../../lib/format';
import { validate, type FieldErrors } from '../../lib/form';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';

interface CourseFormProps {
  initial?: Course | undefined;
  onSubmit: (data: CreateCourseInput) => void;
  onCancel: () => void;
  loading: boolean;
}

export const CourseForm = ({ initial, onSubmit, onCancel, loading }: CourseFormProps) => {
  const { isAdmin } = useCurrentUser();
  const templates = useTemplates();
  // Las colaboradoras se eligen al crear (admin); despues se gestionan en la pagina del curso
  const pickDependencies = isAdmin && !initial;
  const deps = useDependencies(true, pickDependencies);

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? '',
    description: initial?.description ?? '',
    duration_hours: initial?.duration_hours ? String(initial.duration_hours) : '',
    instructor: initial?.instructor ?? '',
    start_date: toDateInput(initial?.start_date),
    end_date: toDateInput(initial?.end_date),
    template_id: initial?.template_id ? String(initial.template_id) : '',
  });
  const [dependencyIds, setDependencyIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      return setErrors({ end_date: 'La fecha de fin no puede ser anterior a la de inicio' });
    }
    const result = validate(createCourseSchema, {
      name: form.name,
      type: form.type || undefined,
      description: form.description.trim() || null,
      duration_hours: form.duration_hours || null,
      instructor: form.instructor.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      template_id: form.template_id ? Number(form.template_id) : null,
      ...(pickDependencies && { dependency_ids: dependencyIds }),
    });
    if (!result.ok) return setErrors(result.errors);
    onSubmit(result.data);
  };

  const availableDeps = (deps.data ?? []).filter((d) => !dependencyIds.includes(d.id));

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Input label="Nombre" required value={form.name} onChange={set('name')} error={errors.name} placeholder="Ej: Primeros Auxilios" />
      <div className="grid-2">
        <Select label="Tipo" required value={form.type} onChange={set('type')} options={courseTypeOptions} error={errors.type} />
        <Select
          label="Diseño de certificado"
          value={form.template_id}
          onChange={set('template_id')}
          options={(templates.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Plantilla por defecto"
          error={errors.template_id}
        />
      </div>
      <Textarea label="Descripcion" rows={2} value={form.description} onChange={set('description')} />
      <div className="grid-2">
        <Input
          label="Duracion (horas)"
          type="number"
          min={1}
          value={form.duration_hours}
          onChange={set('duration_hours')}
          error={errors.duration_hours}
        />
        <Input label="Instructor" value={form.instructor} onChange={set('instructor')} placeholder="Nombre del instructor" />
        <Input label="Fecha de inicio" type="date" value={form.start_date} onChange={set('start_date')} error={errors.start_date} />
        <Input label="Fecha de fin" type="date" value={form.end_date} onChange={set('end_date')} error={errors.end_date} />
      </div>

      {pickDependencies && (
        <div className="field">
          <Select
            label="Dependencias colaboradoras"
            value=""
            onChange={(e) => e.target.value && setDependencyIds((prev) => [...prev, Number(e.target.value)])}
            options={availableDeps.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Agregar dependencia..."
            hint="Sus logos y firmas aparecen en el certificado."
          />
          <div className="chips">
            {dependencyIds.map((id) => (
              <span key={id} className="chip chip--soft">
                {deps.data?.find((d) => d.id === id)?.name}
                <button
                  type="button"
                  className="chip__remove"
                  onClick={() => setDependencyIds((prev) => prev.filter((x) => x !== id))}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="form__actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear curso'}
        </Button>
      </div>
    </form>
  );
};
