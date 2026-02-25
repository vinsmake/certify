// 23.05-23.06 - Formulario de creacion/edicion de curso con validaciones

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const BACKEND = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

const TYPE_OPTIONS = [
  { value: 'curso',    label: 'Curso' },
  { value: 'taller',   label: 'Taller' },
  { value: 'charla',   label: 'Charla' },
  { value: 'seminario',label: 'Seminario' },
  { value: 'diploma',  label: 'Diploma' },
];

const EMPTY = {
  name: '', description: '', type: '', duration_hours: '',
  instructor: '', start_date: '', end_date: '',
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
  } : { ...EMPTY });

  // Dependencias colaboradoras (solo al crear, admin)
  const [selectedDepIds, setSelectedDepIds] = useState([]);

  const addDep = (e) => {
    const id = parseInt(e.target.value);
    if (!id || selectedDepIds.includes(id)) return;
    setSelectedDepIds((prev) => [...prev, id]);
  };

  const removeDep = (id) =>
    setSelectedDepIds((prev) => prev.filter((x) => x !== id));

  const [errors, setErrors] = useState({});
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [hasExistingSignature, setHasExistingSignature] = useState(!!initial?.signature_path);

  // Cargar preview de firma existente via fetch+blob (evita bloqueo CORP de Helmet)
  useEffect(() => {
    if (!initial?.signature_path) return;
    const url = `${BACKEND}${initial.signature_path}`;
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setSignaturePreview(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => setSignaturePreview(null));
  }, [initial?.signature_path]);

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
    setHasExistingSignature(false);
  };

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
    const payload = {
      name:           form.name.trim(),
      description:    form.description.trim() || null,
      type:           form.type,
      duration_hours: form.duration_hours !== '' ? Number(form.duration_hours) : null,
      instructor:     form.instructor.trim()  || null,
      start_date:     form.start_date  || null,
      end_date:       form.end_date    || null,
    };
    // Solo al crear un curso, el admin puede seleccionar dependencias colaboradoras
    if (!initial && userRole === 'admin') {
      payload.dependency_ids = selectedDepIds;
    }
    onSubmit(payload, { signatureFile, signatureRemoved: !signaturePreview && hasExistingSignature });
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

      {!initial && userRole === 'admin' && dependencies.length > 0 && (
        <div style={styles.depSection}>
          <label style={styles.label}>Dependencias colaboradoras</label>

          {selectedDepIds.length > 0 && (
            <div style={styles.depList}>
              {selectedDepIds.map((id) => {
                const dep = dependencies.find((d) => d.id === id);
                return dep ? (
                  <div key={id} style={styles.depChip}>
                    <span>{dep.name}</span>
                    <button type="button" onClick={() => removeDep(id)} style={styles.chipRemove} title="Quitar">
                      &times;
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          )}

          <Select
            value=""
            onChange={addDep}
            options={dependencies
              .filter((d) => !selectedDepIds.includes(d.id))
              .map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Agregar dependencia..."
            style={{ marginBottom: 0 }}
          />
        </div>
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

      <div style={styles.signatureSection}>
        <label style={styles.label}>Firma del instructor (imagen)</label>
        {signaturePreview && (
          <div style={styles.signaturePreview}>
            <img
              src={signaturePreview}
              alt="Firma"
              style={styles.signatureImg}
            />
            <button type="button" onClick={handleRemoveSignature} style={styles.removeBtn}>
              Eliminar firma
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
          onChange={handleSignatureChange}
          style={styles.fileInput}
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
  signatureSection: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.375rem' },
  signaturePreview: { display: 'flex', alignItems: 'center', gap: '1rem' },
  signatureImg: { maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px', padding: '4px' },
  removeBtn: { background: 'none', border: '1px solid #e53e3e', color: '#e53e3e', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  fileInput: { fontSize: '0.875rem' },
  depSection: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  depList:    { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  depChip:    { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: '500' },
  chipRemove: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '1rem', lineHeight: 1, padding: 0 },
};

export default CourseForm;
