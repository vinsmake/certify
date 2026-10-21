import type { ReactNode } from 'react';
import { Spinner } from './Spinner';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  empty?: ReactNode;
  rowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
}

export const Table = <T,>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty = 'No hay datos para mostrar.',
  rowClassName,
  onRowClick,
}: TableProps<T>) => {
  if (loading && !rows) return <Spinner />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!rows?.length ? (
            <tr>
              <td colSpan={columns.length} className="empty-state">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={[rowClassName?.(row), onRowClick && 'is-clickable'].filter(Boolean).join(' ') || undefined}
                onClick={onRowClick && (() => onRowClick(row))}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.className}>
                    {c.render(row)}
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
