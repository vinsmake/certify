// 19.07 - Pagina de login con formulario centrado

import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import theme from '../config/theme';

const LoginPage = () => {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Credenciales Digitales</h1>
          <p style={styles.subtitle}>Ingresa tus credenciales para acceder al sistema</p>
        </div>
        <LoginForm />
      </div>
      <p style={styles.footer}>
        {theme.appTitle}
      </p>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-background)',
    padding: '1.5rem',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    border: '1px solid var(--color-border)',
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  footer: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
  },
};

export default LoginPage;
