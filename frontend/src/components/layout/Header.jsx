// 20.01 - Barra superior: titulo, nombre usuario, dependencia y boton de logout

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import theme from '../../config/theme';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header style={styles.header}>
      <Link to="/dashboard" style={styles.brand}>
        {theme.appTitle}
      </Link>

      <div style={styles.right}>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.full_name}</span>
          {user?.dependency_name && (
            <span style={styles.dependency}>{user.dependency_name}</span>
          )}
          {!user?.dependency_name && user?.role === 'admin' && (
            <span style={styles.roleTag}>Administrador</span>
          )}
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Cerrar sesion
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: '60px',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    boxShadow: 'var(--shadow-sm)',
  },
  brand: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--color-primary)',
    textDecoration: 'none',
    letterSpacing: '-0.01em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.125rem',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    lineHeight: 1,
  },
  dependency: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1,
  },
  roleTag: {
    fontSize: '0.75rem',
    color: 'var(--color-primary)',
    lineHeight: 1,
  },
  logoutBtn: {
    padding: '0.375rem 0.875rem',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
    whiteSpace: 'nowrap',
  },
};

export default Header;
