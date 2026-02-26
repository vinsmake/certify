// 24.05-24.06 - Formulario de creacion/edicion de participante con validaciones

import React, { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const EMPTY = { full_name: '', email: '', dependency_id: '' };

// dependencies: array de { id, name } — solo lo ve el admin
// userRole: 'admin' | 'dependencia'
const ParticipantForm = ({
  initial = null,
  onSubmit,
  onCancel,
  loading = false,
  error = '',
  dependencies = [],
  userRole = 'admin',
}) => {
  const [form, setForm] = useState(initial ? {
    full_name:    initial.full_name    || '',
    email:        initial.email        || '',
    dependency_id: initial.dependency_id ? String(initial.dependency_id) : '',
  } : { ...EMPTY });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    const payload = {
      full_name: form.full_name.trim(),
      email:     form.email.trim() || null,
    };
    if (userRole === 'admin') {
      payload.dependency_id = form.dependency_id ? parseInt(form.dependency_id) : null;
    }
    onSubmit(payload);
  };

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
        placeholder="correo@ejemplo.com (opcional)"
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
            <p style={styles.hint}>Sin dependencia asignada — el participante quedará como Invitado y solo será visible para el administrador.</p>
          )}
        </div>
      )}

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
  form:    { display: 'flex', flexDirection: 'column', gap: '1rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
  hint:    { fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' },
};

export default ParticipantForm;
