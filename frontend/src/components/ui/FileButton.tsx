import { useRef, type ReactNode } from 'react';
import { Button } from './Button';

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/svg+xml,image/webp';

interface FileButtonProps {
  onSelect: (file: File) => void;
  children: ReactNode;
  accept?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
}

/** Boton que abre el selector de archivos (por defecto, imagenes). */
export const FileButton = ({
  onSelect,
  children,
  accept = IMAGE_ACCEPT,
  variant = 'secondary',
  size = 'sm',
  loading,
}: FileButtonProps) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant={variant} size={size} loading={loading} onClick={() => ref.current?.click()}>
        {children}
      </Button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = '';
        }}
      />
    </>
  );
};
