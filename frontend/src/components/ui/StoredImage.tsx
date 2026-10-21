import { useState, type ReactNode } from 'react';

interface StoredImageProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
  /** Que mostrar si no hay imagen o no carga (por defecto un guion, util en tablas) */
  fallback?: ReactNode;
}

/** Imagen del storage (logo o firma). */
export const StoredImage = ({
  path,
  alt,
  className = 'table__img',
  fallback = <span className="muted">—</span>,
}: StoredImageProps) => {
  const [failed, setFailed] = useState<string | null>(null);
  if (!path || failed === path) return fallback;
  return <img src={path} alt={alt} className={className} onError={() => setFailed(path)} />;
};
