// 20.06 - Pie de pagina simple

import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <span>Plataforma de Credenciales Digitales &copy; {year}</span>
    </footer>
  );
};

const styles = {
  footer: {
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    flexShrink: 0,
  },
};

export default Footer;
