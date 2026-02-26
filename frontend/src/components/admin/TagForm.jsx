import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const TagForm = ({ initial = null, onSubmit, onCancel, loading = false, error = '' }) => {
  const [name,        setName]        = useState('');
  const [slug,        setSlug]        = useState('');
  const [description, setDescription] = useState('');
  const [errors,      setErrors]      = useState({});

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setSlug(initial.slug || '');
      setDescription(initial.description || '');
    }
  }, [initial]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    // Auto-generar slug solo al crear (no al editar)
    if (!initial) {
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'El nombre es requerido';
    if (!slug.trim()) e.slug = 'El slug es requerido';
    if (slug && !/^[a-z0-9-]+$/.test(slug)) e.slug = 'Solo letras minusculas, numeros y guiones';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {error && <Alert type="error" message={error} />}

      <Input
        label="Nombre"
        value={name}
        onChange={handleNameChange}
        required
        error={errors.name}
        placeholder="Ej: Evento Nacional 2024"
      />

      <Input
        label="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        required
        error={errors.slug}
        placeholder="Ej: evento-nacional-2024"
      />

      <Input
        label="Descripcion"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripcion opcional del tag"
      />

      <div style={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear tag'}
        </Button>
      </div>
    </form>
  );
};

const styles = {
  form:    { display: 'flex', flexDirection: 'column', gap: '1rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' },
};

export default TagForm;
