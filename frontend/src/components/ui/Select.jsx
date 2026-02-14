// 21.08 - Selector dropdown reutilizable con label y validacion de error

import React from 'react';

/**
 * options: Array de { value, label }
 * value, onChange, label, error, required, disabled, placeholder
 */
const Select = ({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Selecciona una opcion',
  error,
  required = false,
  disabled = false,
  style,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...style }}>
      {label && (
        <label htmlFor={selectId} style={styles.label}>
          {label}
          {required && <span style={styles.required}> *</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          ...styles.select,
          ...(error ? styles.selectError : {}),
          ...(disabled ? styles.selectDisabled : {}),
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={styles.errorMsg}>{error}</span>}
    </div>
  );
};

const styles = {
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
  },
  required: {
    color: 'var(--color-danger)',
  },
  select: {
    padding: '0.5625rem 0.875rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    transition: 'var(--transition)',
    width: '100%',
    cursor: 'pointer',
    appearance: 'auto',
  },
  selectError: {
    borderColor: 'var(--color-danger)',
    backgroundColor: 'var(--color-danger-light)',
  },
  selectDisabled: {
    backgroundColor: 'var(--color-surface-hover)',
    color: 'var(--color-text-muted)',
    cursor: 'not-allowed',
  },
  errorMsg: {
    fontSize: '0.8125rem',
    color: 'var(--color-danger)',
  },
};

export default Select;
