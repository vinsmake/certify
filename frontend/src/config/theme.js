// 18.01 - Configuracion de tema: colores, fuentes y titulo de la aplicacion

const theme = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'Plataforma de Credenciales Digitales',

  colors: {
    primary:       '#2563eb',   // azul institucional
    primaryHover:  '#1d4ed8',
    primaryLight:  '#eff6ff',
    secondary:     '#64748b',
    secondaryHover:'#475569',
    success:       '#16a34a',
    successLight:  '#f0fdf4',
    danger:        '#dc2626',
    dangerHover:   '#b91c1c',
    dangerLight:   '#fef2f2',
    warning:       '#d97706',
    warningLight:  '#fffbeb',
    info:          '#0891b2',
    infoLight:     '#ecfeff',

    // Fondo y superficie
    background:    '#f8fafc',
    surface:       '#ffffff',
    surfaceHover:  '#f1f5f9',
    border:        '#e2e8f0',
    borderFocus:   '#2563eb',

    // Texto
    textPrimary:   '#0f172a',
    textSecondary: '#475569',
    textMuted:     '#94a3b8',
    textInverse:   '#ffffff',

    // Sidebar
    sidebarBg:     '#1e293b',
    sidebarText:   '#94a3b8',
    sidebarActive: '#2563eb',
    sidebarHover:  '#334155',
  },

  fonts: {
    sans:  "'Inter', 'Segoe UI', system-ui, sans-serif",
    mono:  "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSizes: {
    xs:  '0.75rem',
    sm:  '0.875rem',
    base:'1rem',
    lg:  '1.125rem',
    xl:  '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },

  radii: {
    sm:   '0.25rem',
    md:   '0.375rem',
    lg:   '0.5rem',
    xl:   '0.75rem',
    full: '9999px',
  },

  shadows: {
    sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast:   'all 0.15s ease',
    normal: 'all 0.2s ease',
  },
};

export default theme;
