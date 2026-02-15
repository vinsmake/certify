// 24.05-24.06 - Formulario de creacion/edicion de participante con validaciones

import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const EMPTY = { document_id: '', full_name: '', email: '', organization: '', position: '' };

const ParticipantForm = ({ initial = null, onSubmit, onCancel, loading = false, error = '' }) => {
  const [form,   setForm]   = useState(initial ? {
    document_id:  initial.document_id  || '',
    full_name:    initial.full_name    || '',
    email:        initial.email        || '',
    organization: initial.organization || '',
    position:     initial.position     || '',
  } : { ...EMPTY });

  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // 24.06 - Validaciones
  const validate = () => {
    const e = {};
    if (!form.document_id.trim()) e.document_id = 'La cedula es requerida';
    if (!form.full_name.trim())   e.full_name   = 'El nombre es requerido';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'El correo no es valido';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({
      document_id:  form.document_id.trim(),
      full_name:    form.full_name.trim(),
      email:        form.email.trim()        || null,
      organization: form.organization.trim() || null,
      position:     form.position.trim()     || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <Alert type="error" message={error} />}

      <div style={styles.row}>
        <Input
          label="Cedula / Documento"
          value={form.document_id}
          onChange={set('document_id')}
          required
          error={errors.document_id}
          placeholder="Ej: 1234567890"
          style={{ flex: 1 }}
        />
        <Input
          label="Nombre completo"
          value={form.full_name}
          onChange={set('full_name')}
          required
          error={errors.full_name}
          placeholder="Ej: Juan Perez"
          style={{ flex: 2 }}
        />
      </div>

      <Input
        label="Correo electronico"
        type="email"
        value={form.email}
        onChange={set('email')}
        error={errors.email}
        placeholder="correo@ejemplo.com (opcional)"
      />

      <div style={styles.row}>
        <Input
          label="Organizacion"
          value={form.organization}
          onChange={set('organization')}
          placeholder="Ej: UNAM (opcional)"
          style={{ flex: 1 }}
        />
        <Input
          label="Cargo"
          value={form.position}
          onChange={set('position')}
          placeholder="Ej: Docente (opcional)"
          style={{ flex: 1 }}
        />
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
  form:    { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row:     { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
};

export default ParticipantForm;
