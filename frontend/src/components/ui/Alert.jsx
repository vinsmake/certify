// 21.07 - Mensajes de exito, error, advertencia e informacion

import React, { useState } from 'react';

const TYPES = {
  success: {
    background: 'var(--color-success-light)',
    color:      'var(--color-success)',
    border:     '#86efac',
    icon:       '\u2713',
  },
  error: {
    background: 'var(--color-danger-light)',
    color:      'var(--color-danger)',
    border:     '#fca5a5',
    icon:       '\u2715',
  },
  warning: {
    background: 'var(--color-warning-light)',
    color:      'var(--color-warning)',
    border:     '#fcd34d',
    icon:       '\u26a0',
  },
  info: {
    background: 'var(--color-primary-light)',
    color:      'var(--color-primary)',
    border:     '#93c5fd',
    icon:       '\u2139',
  },
};

const Alert = ({ type = 'info', message, dismissible = false, style }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  const config = TYPES[type] || TYPES.info;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${config.border}`,
        backgroundColor: config.background,
        color: config.color,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        ...style,
      }}
    >
      <span style={{ flexShrink: 0, fontWeight: '700', marginTop: '0.05rem' }}>
        {config.icon}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: config.color,
            cursor: 'pointer',
            fontSize: '1.1rem',
            lineHeight: 1,
            flexShrink: 0,
            padding: 0,
            opacity: 0.7,
          }}
          aria-label="Cerrar"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default Alert;
