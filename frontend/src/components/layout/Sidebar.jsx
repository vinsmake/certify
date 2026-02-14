// 20.02 / 20.03 / 20.04 / 20.13 - Menu lateral diferenciado por rol con estado activo

import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

// Menus por rol
const MENU_COMMON = [
  { label: 'Dashboard',      path: '/dashboard' },
  { label: 'Cursos',         path: '/cursos' },
  { label: 'Participantes',  path: '/participantes' },
  { label: 'Certificados',   path: '/certificados' },
  { label: 'Emitir',         path: '/emitir' },
];

const MENU_ADMIN_ONLY = [
  { label: 'Dependencias',        path: '/admin/dependencias' },
  { label: 'Plantillas',          path: '/admin/plantillas' },
  { label: 'Usuarios',            path: '/admin/usuarios' },
  { label: 'Eventos globales',    path: '/admin/eventos' },
  { label: 'Certificados global', path: '/admin/certificados-global' },
  { label: 'Actividad',          path: '/admin/actividad' },
  { label: 'Configuracion',       path: '/configuracion' },
];

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside style={styles.sidebar}>
      <nav>
        <ul style={styles.menu}>
          {MENU_COMMON.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  ...styles.link,
                  ...(isActive ? styles.linkActive : {}),
                })}
              >
                {item.label}
              </NavLink>
            </li>
          ))}

          {user?.role === 'admin' && (
            <>
              <li style={styles.divider} />
              <li style={styles.sectionLabel}>Administracion</li>
              {MENU_ADMIN_ONLY.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    style={({ isActive }) => ({
                      ...styles.link,
                      ...(isActive ? styles.linkActive : {}),
                    })}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '220px',
    minWidth: '220px',
    backgroundColor: 'var(--color-sidebar-bg)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    padding: '1rem 0',
    overflowY: 'auto',
    position: 'fixed',
    top: '60px',
    bottom: 0,
    left: 0,
    zIndex: 90,
  },
  menu: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  link: {
    display: 'block',
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    color: 'var(--color-sidebar-text)',
    textDecoration: 'none',
    transition: 'var(--transition)',
    borderLeft: '3px solid transparent',
  },
  linkActive: {
    color: '#ffffff',
    backgroundColor: 'var(--color-sidebar-hover)',
    borderLeft: '3px solid var(--color-sidebar-active)',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    margin: '0.75rem 1.25rem',
  },
  sectionLabel: {
    padding: '0.375rem 1.25rem',
    fontSize: '0.6875rem',
    fontWeight: '600',
    color: 'rgba(148,163,184,0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
};

export default Sidebar;
