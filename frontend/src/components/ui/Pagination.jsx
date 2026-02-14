// 21.06 - Controles de paginacion: anterior, paginas numeradas, siguiente

import React from 'react';

/**
 * page:     pagina actual (1-indexed)
 * total:    total de registros
 * limit:    registros por pagina
 * onChange(newPage): callback al cambiar de pagina
 */
const Pagination = ({ page, total, limit, onChange }) => {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  // Ventana de paginas a mostrar: hasta 5, centrada en la pagina actual
  const getPages = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pages = getPages();
  const from  = (page - 1) * limit + 1;
  const to    = Math.min(page * limit, total);

  return (
    <div style={styles.wrapper}>
      <span style={styles.info}>
        {from}–{to} de {total}
      </span>

      <div style={styles.controls}>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{ ...styles.btn, ...(page === 1 ? styles.btnDisabled : {}) }}
        >
          Anterior
        </button>

        {pages[0] > 1 && (
          <>
            <button onClick={() => onChange(1)} style={styles.btn}>1</button>
            {pages[0] > 2 && <span style={styles.ellipsis}>…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            style={{
              ...styles.btn,
              ...(p === page ? styles.btnActive : {}),
            }}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span style={styles.ellipsis}>…</span>
            )}
            <button onClick={() => onChange(totalPages)} style={styles.btn}>
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={{ ...styles.btn, ...(page === totalPages ? styles.btnDisabled : {}) }}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  info: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  btn: {
    padding: '0.375rem 0.625rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-secondary)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
    minWidth: '2rem',
    textAlign: 'center',
  },
  btnActive: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-text-inverse)',
    borderColor: 'var(--color-primary)',
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  ellipsis: {
    color: 'var(--color-text-muted)',
    fontSize: '0.875rem',
    padding: '0 0.25rem',
  },
};

export default Pagination;
