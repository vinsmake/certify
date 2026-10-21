interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

/** Controles de paginacion con ventana de 5 paginas centrada en la actual. */
export const Pagination = ({ page, total, limit, onChange }: PaginationProps) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const pageButton = (p: number) => (
    <button key={p} className={`pagination__btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>
      {p}
    </button>
  );

  return (
    <div className="pagination">
      <span className="muted">
        {(page - 1) * limit + 1}-{Math.min(page * limit, total)} de {total}
      </span>
      <div className="pagination__pages">
        <button className="pagination__btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
          Anterior
        </button>
        {start > 1 && pageButton(1)}
        {start > 2 && <span className="muted">...</span>}
        {pages.map(pageButton)}
        {end < totalPages - 1 && <span className="muted">...</span>}
        {end < totalPages && pageButton(totalPages)}
        <button className="pagination__btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
};
