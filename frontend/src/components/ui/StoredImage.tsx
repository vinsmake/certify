import { useState } from 'react';

interface StoredImageProps {
  path: string | null | undefined;
  alt: string;
  className?: string;
}

/** Imagen del storage (logo o firma). Muestra un guion si no existe o no carga. */
export const StoredImage = ({ path, alt, className = 'table__img' }: StoredImageProps) => {
  const [failed, setFailed] = useState<string | null>(null);
  if (!path || failed === path) return <span className="muted">—</span>;
  return <img src={path} alt={alt} className={className} onError={() => setFailed(path)} />;
};
