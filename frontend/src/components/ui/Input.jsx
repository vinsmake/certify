// 21.02 - Input con label, placeholder y validacion visual de error

import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  style,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', ...style }}>
      {label && (
        <label htmlFor={inputId} style={styles.label}>
          {label}
          {required && <span style={styles.required}> *</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        style={{
          ...styles.input,
          ...(error ? styles.inputError : {}),
          ...(disabled ? styles.inputDisabled : {}),
        }}
        {...props}
      />
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
  input: {
    padding: '0.5625rem 0.875rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9375rem',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    transition: 'var(--transition)',
    width: '100%',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
    backgroundColor: 'var(--color-danger-light)',
  },
  inputDisabled: {
    backgroundColor: 'var(--color-surface-hover)',
    color: 'var(--color-text-muted)',
    cursor: 'not-allowed',
  },
  errorMsg: {
    fontSize: '0.8125rem',
    color: 'var(--color-danger)',
  },
};

export default Input;
