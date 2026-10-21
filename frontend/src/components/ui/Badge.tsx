import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'danger' | 'info' | 'purple' | 'warning';

// Etiquetas conocidas del dominio (estado de certificado, asistencia, rol, activo)
const KNOWN: Record<string, { label: string; tone: Tone }> = {
  valid: { label: 'Valido', tone: 'success' },
  revoked: { label: 'Revocado', tone: 'danger' },
  enrolled: { label: 'Inscrito', tone: 'info' },
  completed: { label: 'Completado', tone: 'success' },
  active: { label: 'Activo', tone: 'success' },
  inactive: { label: 'Inactivo', tone: 'neutral' },
  admin: { label: 'Admin', tone: 'purple' },
  dependencia: { label: 'Dependencia', tone: 'info' },
};

interface BadgeProps {
  status?: string;
  tone?: Tone;
  children?: ReactNode;
}

export const Badge = ({ status, tone, children }: BadgeProps) => {
  const known = status ? KNOWN[status] : undefined;
  const finalTone = tone ?? known?.tone ?? 'neutral';
  return <span className={`badge badge--${finalTone}`}>{children ?? known?.label ?? status}</span>;
};
