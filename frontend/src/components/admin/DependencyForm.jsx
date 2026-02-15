// 28.02 - Formulario de dependencia (nombre y abreviatura)

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const DependencyForm = ({ initial, onSubmit, onCancel, loading, error }) => {
  const [name,         setName]         = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [errors,       setErrors]       = useState({});

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setAbbreviation(initial.abbreviation || '');
    }
  }, [initial]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'El nombre es requerido.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit({ name: name.trim(), abbreviation: abbreviation.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error" message={error} style={{ marginBottom: '1rem' }} />}

      <Input
        label="Nombre"
        id="dep-name"
        value={name}
        onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
        error={errors.name}
        required
        placeholder="Ej: Departamento de Recursos Humanos"
      />
      <Input
        label="Abreviatura"
        id="dep-abbr"
        value={abbreviation}
        onChange={(e) => setAbbreviation(e.target.value)}
        placeholder="Ej: DDRRHH (opcional)"
      />

      <div style={styles.footer}>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>{initial ? 'Guardar cambios' : 'Crear dependencia'}</Button>
      </div>
    </form>
  );
};

const styles = {
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' },
};

export default DependencyForm;
