// 28.12 - Formulario de usuario: email, nombre, password, rol, dependencia

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Administrador' },
  { value: 'emisor', label: 'Emisor'         },
];

const UserForm = ({ initial, dependencies, onSubmit, onCancel, loading, error }) => {
  const [email,      setEmail]      = useState('');
  const [fullName,   setFullName]   = useState('');
  const [password,   setPassword]   = useState('');
  const [role,       setRole]       = useState('emisor');
  const [depId,      setDepId]      = useState('');
  const [isActive,   setIsActive]   = useState(true);
  const [errors,     setErrors]     = useState({});
  const isEdit = !!initial;

  useEffect(() => {
    if (initial) {
      setEmail(initial.email || '');
      setFullName(initial.full_name || '');
      setRole(initial.role || 'emisor');
      setDepId(initial.dependency_id ? String(initial.dependency_id) : '');
      setIsActive(initial.is_active !== false);
    }
  }, [initial]);

  const validate = () => {
    const e = {};
    if (!email.trim())    e.email    = 'El email es requerido.';
    if (!fullName.trim()) e.fullName = 'El nombre es requerido.';
    if (!isEdit && password.length < 8)
      e.password = 'La contrasena debe tener al menos 8 caracteres.';
    if (role === 'emisor' && !depId)
      e.depId = 'La dependencia es requerida para el rol emisor.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    const payload = {
      email:         email.trim(),
      full_name:     fullName.trim(),
      role,
      dependency_id: depId ? parseInt(depId) : null,
    };
    if (!isEdit) payload.password = password;
    if (isEdit)  payload.is_active = isActive;

    onSubmit(payload);
  };

  const depOptions = (dependencies || []).map((d) => ({ value: d.id, label: d.name }));

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error" message={error} style={{ marginBottom: '1rem' }} />}

      <div style={styles.row}>
        <div style={styles.col}>
          <Input label="Nombre completo" id="usr-name" value={fullName} required
            onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: '' })); }}
            error={errors.fullName} placeholder="Ej: Maria Garcia" />
        </div>
        <div style={styles.col}>
          <Input label="Email" id="usr-email" type="email" value={email} required
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
            error={errors.email} placeholder="usuario@ejemplo.com" />
        </div>
      </div>

      {!isEdit && (
        <Input label="Contrasena" id="usr-pass" type="password" value={password} required
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
          error={errors.password} placeholder="Minimo 8 caracteres" />
      )}

      <div style={styles.row}>
        <div style={styles.col}>
          <Select label="Rol" id="usr-role" value={role}
            onChange={(e) => { setRole(e.target.value); setErrors((p) => ({ ...p, depId: '' })); }}
            options={ROLE_OPTIONS} />
        </div>
        <div style={styles.col}>
          <Select label="Dependencia" id="usr-dep" value={depId}
            onChange={(e) => { setDepId(e.target.value); setErrors((p) => ({ ...p, depId: '' })); }}
            options={depOptions}
            placeholder={role === 'admin' ? 'Sin dependencia (admin)' : 'Selecciona una...'}
            error={errors.depId}
          />
        </div>
      </div>

      {isEdit && (
        <label style={styles.checkRow}>
          <input type="checkbox" checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: '1rem', height: '1rem' }} />
          <span style={styles.checkLabel}>Usuario activo</span>
        </label>
      )}

      <div style={styles.footer}>
        <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Guardar cambios' : 'Crear usuario'}</Button>
      </div>
    </form>
  );
};

const styles = {
  row:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  col:       {},
  checkRow:  { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 1rem', cursor: 'pointer' },
  checkLabel:{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: '500' },
  footer:    { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' },
};

export default UserForm;
