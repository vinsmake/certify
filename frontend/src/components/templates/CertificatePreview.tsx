// Muestra un certificado (HTML ya renderizado por el backend) a escala dentro de un iframe aislado.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Orientation, PageSize } from '@certify/shared';

// Tamaño de pagina en px CSS (96 dpi), horizontal
const PAGE_PX: Record<PageSize, { width: number; height: number }> = {
  letter: { width: 1056, height: 816 },
  A4: { width: 1123, height: 794 },
};

export const pageDimensions = (orientation: Orientation, pageSize: PageSize) => {
  const base = PAGE_PX[pageSize];
  return orientation === 'portrait' ? { width: base.height, height: base.width } : base;
};

interface CertificatePreviewProps {
  html: string | undefined;
  orientation: Orientation;
  pageSize: PageSize;
  /** Contenido extra en la barra superior (acciones) */
  toolbar?: ReactNode;
  loading?: boolean;
}

export const CertificatePreview = ({ html, orientation, pageSize, toolbar, loading }: CertificatePreviewProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const page = pageDimensions(orientation, pageSize);

  // Ajusta la escala al ancho disponible
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => setScale(Math.max(0.2, Math.min((stage.clientWidth - 24) / page.width, 1)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [page.width]);

  return (
    <div className="preview">
      <div className="preview__bar">
        <span className="muted">
          {pageSize === 'A4' ? 'A4' : 'Carta'} {orientation === 'portrait' ? 'vertical' : 'horizontal'} ·{' '}
          {Math.round(scale * 100)}%{loading ? ' · actualizando...' : ''}
        </span>
        {toolbar && <div className="row">{toolbar}</div>}
      </div>
      <div ref={stageRef} className="preview__stage">
        {html === undefined ? (
          <p className="muted">Sin contenido para mostrar.</p>
        ) : (
          <div className="preview__page" style={{ width: page.width * scale, height: page.height * scale }}>
            {/* sandbox sin scripts: la plantilla solo se muestra */}
            <iframe
              title="Vista previa del certificado"
              sandbox=""
              srcDoc={html}
              style={{ width: page.width, height: page.height, transform: `scale(${scale})` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
