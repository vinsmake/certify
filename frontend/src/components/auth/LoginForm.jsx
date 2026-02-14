// 19.06 - Formulario de login con email, password y manejo de errores

import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // 19.08 - Manejo de errores
      const msg = err.response?.data?.error;
      if (err.response?.status === 401 || msg === 'Credenciales incorrectas') {
        setError('Email o contrasena incorrectos.');
      } else if (err.response?.status === 422) {
        setError('Por favor completa todos los campos correctamente.');
      } else if (!err.response) {
        setError('No se pudo conectar con el servidor. Verifica tu conexion.');
      } else {
        setError('Ocurrio un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>Correo electronico</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          placeholder="usuario@correo.com"
        />
      </div>

      <div style={styles.field}>
        <label htmlFor="password" style={styles.label}>Contrasena</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div style={styles.errorBox} role="alert">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} style={{
        ...styles.button,
        ...(loading ? styles.buttonDisabled : {}),
      }}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
  },
  input: {
    padding: '0.625rem 0.875rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    transition: 'var(--transition)',
    width: '100%',
  },
  errorBox: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    border: '1px solid #fca5a5',
  },
  button: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: 'var(--color-text-muted)',
    cursor: 'not-allowed',
  },
};

export default LoginForm;
