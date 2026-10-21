import { useState, type FormEvent } from 'react';
import { createParticipantSchema, type CreateParticipantInput, type Participant, type TagSummary } from '@certify/shared';
import { useDependencies, useTags } from '../../api/queries';
import { useCurrentUser } from '../../auth/useAuth';
import { validate, type FieldErrors } from '../../lib/form';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Field';

interface ParticipantFormProps {
  initial?: Participant | undefined;
  onSubmit: (data: CreateParticipantInput) => void;
  onCancel: () => void;
  loading: boolean;
}

export const ParticipantForm = ({ initial, onSubmit, onCancel, loading }: ParticipantFormProps) => {
  const { isAdmin } = useCurrentUser();
  const deps = useDependencies(true, isAdmin);
  const tags = useTags();

  const [fullName, setFullName] = useState(initial?.full_name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [dependencyId, setDependencyId] = useState(initial?.dependency_id ? String(initial.dependency_id) : '');
  const [selectedTags, setSelectedTags] = useState<TagSummary[]>(initial?.tags ?? []);
  const [errors, setErrors] = useState<FieldErrors>({});

  const availableTags = (tags.data ?? []).filter((t) => t.is_active && !selectedTags.some((s) => s.id === t.id));

  const addTag = (id: string) => {
    const tag = tags.data?.find((t) => t.id === Number(id));
    if (tag) setSelectedTags((prev) => [...prev, tag]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(createParticipantSchema, {
      full_name: fullName,
      email: email.trim() || null,
      tag_ids: selectedTags.map((t) => t.id),
      // Solo el admin elige dependencia; el rol dependencia siempre crea en la suya
      ...(isAdmin && { dependency_id: dependencyId ? Number(dependencyId) : null }),
    });
    if (!result.ok) return setErrors(result.errors);
    onSubmit(result.data);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Nombre completo"
        required
        value={fullName}
        error={errors.full_name}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Ej: Juan Perez"
      />
      <Input
        label="Correo electronico"
        type="email"
        value={email}
        error={errors.email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@ejemplo.com"
      />
      {isAdmin && (
        <Select
          label="Dependencia"
          value={dependencyId}
          onChange={(e) => setDependencyId(e.target.value)}
          options={(deps.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Sin dependencia (invitado)"
          hint={!dependencyId && 'Sin dependencia el participante queda como invitado y solo lo ve el administrador.'}
        />
      )}

      <div className="field">
        <Select
          label="Tags"
          value=""
          onChange={(e) => addTag(e.target.value)}
          options={availableTags.map((t) => ({ value: t.id, label: t.name }))}
          placeholder={availableTags.length ? 'Agregar tag...' : 'No hay mas tags disponibles'}
          disabled={!availableTags.length}
        />
        {selectedTags.length > 0 && (
          <div className="chips">
            {selectedTags.map((tag) => (
              <span key={tag.id} className="chip chip--primary">
                {tag.logo_path && <img src={tag.logo_path} alt="" className="chip__logo" />}
                {tag.name}
                <button
                  type="button"
                  className="chip__remove"
                  title="Quitar"
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id))}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="form__actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear participante'}
        </Button>
      </div>
    </form>
  );
};
