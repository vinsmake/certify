// 30.02 - Pagina 403 para acceso denegado por rol

import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div style={styles.container}>
    <div style={styles.card}>
      <span style={styles.code}>403</span>
      <h1 style={styles.title}>Acceso denegado</h1>
      <p style={styles.text}>No tienes permisos suficientes para acceder a esta seccion.</p>
      <Link to="/dashboard" style={styles.link}>Volver al inicio</Link>
    </div>
  </div>
);

const styles = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '2rem',
  },
  card: {
    textAlign: 'center', padding: '3rem 2rem',
    backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)', maxWidth: '420px', width: '100%',
  },
  code: {
    display: 'block', fontSize: '4rem', fontWeight: '800',
    color: 'var(--color-warning)', lineHeight: 1, marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-text-primary)',
    margin: '0 0 0.5rem',
  },
  text: {
    fontSize: '0.875rem', color: 'var(--color-text-muted)',
    marginBottom: '1.5rem', lineHeight: 1.5,
  },
  link: {
    display: 'inline-block', padding: '0.5rem 1.25rem',
    backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)',
    borderRadius: 'var(--radius-md)', textDecoration: 'none',
    fontSize: '0.875rem', fontWeight: '500',
  },
};

export default UnauthorizedPage;
