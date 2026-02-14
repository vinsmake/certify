// 21.04 - Tabla generica con headers, filas y soporte para acciones

import React from 'react';

/**
 * columns: Array de { key, label, render?: (value, row) => ReactNode, width? }
 * data:    Array de objetos
 * loading: boolean
 * emptyText: string
 * onRowClick: (row) => void (opcional)
 */
const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'No hay datos para mostrar.',
  onRowClick,
}) => {
  if (loading) {
    return (
      <div style={styles.stateBox}>
        <span style={{ color: 'var(--color-text-muted)' }}>Cargando...</span>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ ...styles.th, ...(col.width ? { width: col.width } : {}) }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={styles.emptyCell}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                style={{
                  ...styles.row,
                  ...(onRowClick ? styles.rowClickable : {}),
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} style={styles.td}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  wrapper: {
    overflowX: 'auto',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  headerRow: {
    backgroundColor: 'var(--color-surface-hover)',
    borderBottom: '1px solid var(--color-border)',
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    fontSize: '0.8125rem',
    whiteSpace: 'nowrap',
  },
  row: {
    borderBottom: '1px solid var(--color-border)',
    transition: 'background-color 0.15s ease',
  },
  rowClickable: {
    cursor: 'pointer',
  },
  td: {
    padding: '0.75rem 1rem',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '2.5rem 1rem',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  },
  stateBox: {
    padding: '2.5rem',
    textAlign: 'center',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--color-surface)',
  },
};

export default Table;
