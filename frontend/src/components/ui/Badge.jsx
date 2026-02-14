// 21.09 - Etiquetas de estado para certificados, cursos y usuarios

import React from 'react';

const VARIANTS = {
  // Certificados
  valid:    { bg: 'var(--color-success-light)', color: 'var(--color-success)',   label: 'Valido'    },
  revoked:  { bg: 'var(--color-danger-light)',  color: 'var(--color-danger)',    label: 'Revocado'  },
  // Asistencia
  enrolled:  { bg: '#eff6ff', color: '#1d4ed8', label: 'Inscrito'   },
  attended:  { bg: '#f0fdf4', color: '#15803d', label: 'Asistio'    },
  completed: { bg: 'var(--color-success-light)', color: 'var(--color-success)', label: 'Completado' },
  absent:    { bg: '#f8fafc', color: 'var(--color-text-muted)', label: 'Ausente' },
  // Usuarios / dependencias
  active:   { bg: 'var(--color-success-light)', color: 'var(--color-success)',   label: 'Activo'    },
  inactive: { bg: '#f8fafc',                    color: 'var(--color-text-muted)', label: 'Inactivo' },
  // Roles
  admin:    { bg: '#faf5ff', color: '#7c3aed', label: 'Admin'   },
  emisor:   { bg: '#eff6ff', color: '#1d4ed8', label: 'Emisor'  },
};

/**
 * status: clave del mapa VARIANTS  o
 * label:  texto personalizado (si no se encuentra en el mapa)
 * variant: fuerza una variante especifica
 */
const Badge = ({ status, label, variant, style }) => {
  const key = variant || status;
  const config = VARIANTS[key];

  const displayLabel = config?.label ?? label ?? status ?? '';
  const bg    = config?.bg    ?? 'var(--color-surface-hover)';
  const color = config?.color ?? 'var(--color-text-secondary)';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.625rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: bg,
        color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {displayLabel}
    </span>
  );
};

export default Badge;
