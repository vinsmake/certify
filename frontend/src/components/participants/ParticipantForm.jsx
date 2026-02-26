// 24.05-24.06 - Formulario de creacion/edicion de participante con validaciones

import React, { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

const EMPTY = { full_name: '', email: '', dependency_id: '' };

// dependencies: array de { id, name } — solo lo ve el admin
// tags: array de todos los tags disponibles { id, name, slug, logo_path }
// userRole: 'admin' | 'dependencia'
const ParticipantForm = ({
  initial = null,
  onSubmit,
  onCancel,
  loading = false,
  error = '',
  dependencies = [],
  tags = [],
  userRole = 'admin',
}) => {
  const [form, setForm] = useState(initial ? {
    full_name:    initial.full_name    || '',
    email:        initial.email        || '',
    dependency_id: initial.dependency_id ? String(initial.dependency_id) : '',
  } : { ...EMPTY });

  // Tags seleccionados: array de objetos tag
  const [selectedTags, setSelectedTags] = useState(
    initial?.tags && Array.isArray(initial.tags) ? initial.tags : []
  );
  const [tagDropdown, setTagDropdown] = useState('');

  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'El nombre es requerido';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'El correo no es valido';
    return e;
  };

  const handleAddTag = () => {
    if (!tagDropdown) return;
    const tagId = parseInt(tagDropdown);
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;
    if (selectedTags.some((t) => t.id === tagId)) return;
    setSelectedTags((prev) => [...prev, tag]);
    setTagDropdown('');
  };

  const handleRemoveTag = (tagId) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const payload = {
      full_name: form.full_name.trim(),
      email:     form.email.trim() || null,
      tag_ids:   selectedTags.map((t) => t.id),
    };
    if (userRole === 'admin') {
      payload.dependency_id = form.dependency_id ? parseInt(form.dependency_id) : null;
    }
    onSubmit(payload);
  };

  // Tags disponibles para el dropdown (excluyendo los ya seleccionados)
  const availableTags = tags.filter((t) => !selectedTags.some((s) => s.id === t.id));
  const tagOptions = availableTags.map((t) => ({ value: t.id, label: t.name }));

  const depOptions = (dependencies || []).map((d) => ({ value: d.id, label: d.name }));

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <Alert type="error" message={error} />}

      <Input
        label="Nombre completo"
        value={form.full_name}
        onChange={set('full_name')}
        required
        error={errors.full_name}
        placeholder="Ej: Juan Perez"
      />

      <Input
        label="Correo electronico"
        type="email"
        value={form.email}
        onChange={set('email')}
        error={errors.email}
        placeholder="correo@ejemplo.com"
      />

      {userRole === 'admin' && (
        <div>
          <Select
            label="Dependencia"
            value={form.dependency_id}
            onChange={set('dependency_id')}
            options={depOptions}
            placeholder="Sin dependencia (Invitado)"
            error={errors.dependency_id}
          />
          {!form.dependency_id && (
            <p style={styles.hint}>Sin dependencia asignada — el participante quedara como Invitado y solo sera visible para el administrador.</p>
          )}
        </div>
      )}

      {/* Selector de tags */}
      <div>
        <label style={styles.label}>Tags</label>
        <div style={styles.tagRow}>
          <div style={styles.tagSelect}>
            <Select
              value={tagDropdown}
              onChange={(e) => setTagDropdown(e.target.value)}
              options={tagOptions}
              placeholder={availableTags.length === 0 ? 'No hay mas tags disponibles' : 'Seleccionar tag...'}
              disabled={availableTags.length === 0}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddTag}
            disabled={!tagDropdown}
            size="sm"
          >
            Agregar
          </Button>
        </div>

        {selectedTags.length > 0 && (
          <div style={styles.tagChips}>
            {selectedTags.map((tag) => (
              <span key={tag.id} style={styles.chip}>
                {tag.logo_path && (
                  <img
                    src={`${BACKEND}${tag.logo_path}`}
                    alt={tag.name}
                    style={styles.chipLogo}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <span>{tag.name}</span>
                <button
                  type="button"
                  style={styles.chipRemove}
                  onClick={() => handleRemoveTag(tag.id)}
                  title="Quitar tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear participante'}
        </Button>
      </div>
    </form>
  );
};

const styles = {
  form:       { display: 'flex', flexDirection: 'column', gap: '1rem' },
  actions:    { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
  hint:       { fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' },
  label:      { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '0.375rem' },
  tagRow:     { display: 'flex', gap: '0.5rem', alignItems: 'flex-end' },
  tagSelect:  { flex: 1 },
  tagChips:   { display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
    padding: '0.25rem 0.625rem', borderRadius: '999px',
    backgroundColor: 'var(--color-primary)', color: '#fff',
    fontSize: '0.8125rem', fontWeight: '500',
  },
  chipLogo:   { width: '16px', height: '16px', objectFit: 'contain', borderRadius: '50%' },
  chipRemove: {
    background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
    padding: '0 2px', fontSize: '1rem', lineHeight: '1', opacity: 0.8,
  },
};

export default ParticipantForm;
