import { useState, type ReactNode } from 'react';

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' } as const;

export type AlertType = keyof typeof ICONS;

interface AlertProps {
  type?: AlertType;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert = ({ type = 'info', children, onClose, className }: AlertProps) => (
  <div role="alert" className={['alert', `alert--${type}`, className].filter(Boolean).join(' ')}>
    <strong>{ICONS[type]}</strong>
    <div className="grow">{children}</div>
    {onClose && (
      <button className="alert__close" onClick={onClose} aria-label="Cerrar">
        &times;
      </button>
    )}
  </div>
);

/** Alerta que el usuario puede cerrar; se vuelve a mostrar si cambia el mensaje. */
export const DismissibleAlert = ({ type, message }: { type?: AlertType; message: string | null | undefined }) => {
  const [closed, setClosed] = useState<string | null>(null);
  if (!message || closed === message) return null;
  return (
    <Alert type={type} onClose={() => setClosed(message)}>
      {message}
    </Alert>
  );
};
