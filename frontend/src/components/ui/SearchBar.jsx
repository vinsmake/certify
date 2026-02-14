// 21.05 - Barra de busqueda con debounce

import React, { useState, useEffect } from 'react';

/**
 * onSearch(value): se llama 350ms despues de que el usuario deja de escribir
 * placeholder: texto del input
 * initialValue: valor inicial (no controlado externamente)
 */
const SearchBar = ({ onSearch, placeholder = 'Buscar...', initialValue = '' }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 350);
    return () => clearTimeout(timer);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={styles.wrapper}>
      <span style={styles.icon}>&#128269;</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
      {value && (
        <button
          onClick={() => setValue('')}
          style={styles.clearBtn}
          aria-label="Limpiar busqueda"
        >
          &times;
        </button>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '360px',
  },
  icon: {
    position: 'absolute',
    left: '0.75rem',
    fontSize: '0.9rem',
    pointerEvents: 'none',
    color: 'var(--color-text-muted)',
  },
  input: {
    width: '100%',
    padding: '0.5rem 2.25rem 0.5rem 2.25rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
    outline: 'none',
    transition: 'var(--transition)',
  },
  clearBtn: {
    position: 'absolute',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 0.25rem',
  },
};

export default SearchBar;
