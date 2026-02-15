// 23.05-23.06 - Formulario de creacion/edicion de curso con validaciones

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const TYPE_OPTIONS = [
  { value: 'curso',    label: 'Curso' },
  { value: 'taller',   label: 'Taller' },
  { value: 'charla',   label: 'Charla' },
  { value: 'seminario',label: 'Seminario' },
  { value: 'otro',     label: 'Otro' },
];

const EMPTY = {
  name: '', description: '', type: '', duration_hours: '',
  instructor: '', start_date: '', end_date: '', dependency_id: '',
};

const CourseForm = ({ initial = null, onSubmit, onCancel, loading = false, error = '', dependencies = [], userRole = '' }) => {
  const [form,   setForm]   = useState(initial ? {
    name:           initial.name         || '',
    description:    initial.description  || '',
    type:           initial.type         || '',
    duration_hours: initial.duration_hours ?? '',
    instructor:     initial.instructor   || '',
    start_date:     initial.start_date   ? initial.start_date.slice(0, 10) : '',
    end_date:       initial.end_date     ? initial.end_date.slice(0, 10)   : '',
    dependency_id:  initial.dependency_id ? String(initial.dependency_id)  : '',
  } : { ...EMPTY });

  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // 23.06 - Validaciones
  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name = 'El nombre es requerido';
    if (!form.type)         e.type = 'El tipo es requerido';
    if (form.duration_hours !== '' && (isNaN(form.duration_hours) || Number(form.duration_hours) <= 0))
      e.duration_hours = 'Debe ser un numero mayor a 0';
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = 'La fecha de fin no puede ser anterior a la de inicio';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({
      name:           form.name.trim(),
      description:    form.description.trim() || null,
      type:           form.type,
      duration_hours: form.duration_hours !== '' ? Number(form.duration_hours) : null,
      instructor:     form.instructor.trim()  || null,
      start_date:     form.start_date  || null,
      end_date:       form.end_date    || null,
      dependency_id:  form.dependency_id ? Number(form.dependency_id) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <Alert type="error" message={error} />}

      <Input
        label="Nombre del curso"
        value={form.name}
        onChange={set('name')}
        required
        error={errors.name}
        placeholder="Ej: Primeros Auxilios"
      />

      <Select
        label="Tipo"
        value={form.type}
        onChange={set('type')}
        options={TYPE_OPTIONS}
        required
        error={errors.type}
        placeholder="Selecciona el tipo"
      />

      {userRole === 'admin' && dependencies.length > 0 && (
        <Select
          label="Dependencia"
          value={form.dependency_id}
          onChange={set('dependency_id')}
          options={dependencies.map((d) => ({ value: String(d.id), label: d.name }))}
          placeholder="Selecciona una dependencia"
        />
      )}

      <Input
        label="Descripcion"
        value={form.description}
        onChange={set('description')}
        placeholder="Descripcion breve (opcional)"
      />

      <div style={styles.row}>
        <Input
          label="Duracion (horas)"
          type="number"
          value={form.duration_hours}
          onChange={set('duration_hours')}
          error={errors.duration_hours}
          placeholder="Ej: 8"
          style={{ flex: 1 }}
        />
        <Input
          label="Instructor"
          value={form.instructor}
          onChange={set('instructor')}
          placeholder="Nombre del instructor"
          style={{ flex: 2 }}
        />
      </div>

      <div style={styles.row}>
        <Input
          label="Fecha de inicio"
          type="date"
          value={form.start_date}
          onChange={set('start_date')}
          style={{ flex: 1 }}
        />
        <Input
          label="Fecha de fin"
          type="date"
          value={form.end_date}
          onChange={set('end_date')}
          error={errors.end_date}
          style={{ flex: 1 }}
        />
      </div>

      <div style={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear curso'}
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

export default CourseForm;
