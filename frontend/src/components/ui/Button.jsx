// 21.01 - Boton reutilizable con variantes: primary, secondary, danger, ghost

import React from 'react';

const VARIANTS = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    border: '1px solid var(--color-primary)',
  },
  secondary: {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  },
  danger: {
    backgroundColor: 'var(--color-danger)',
    color: 'var(--color-text-inverse)',
    border: '1px solid var(--color-danger)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
};

const SIZES = {
  sm: { padding: '0.25rem 0.625rem', fontSize: '0.8125rem' },
  md: { padding: '0.5rem 1rem',      fontSize: '0.875rem'  },
  lg: { padding: '0.75rem 1.5rem',   fontSize: '1rem'      },
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  style,
  ...props
}) => {
  const variantStyle = VARIANTS[variant] || VARIANTS.primary;
  const sizeStyle    = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.375rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: '500',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'var(--transition)',
        opacity: disabled || loading ? 0.6 : 1,
        whiteSpace: 'nowrap',
        ...variantStyle,
        ...sizeStyle,
        ...style,
      }}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
};

export default Button;
