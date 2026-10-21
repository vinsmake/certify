import { COURSE_TYPE_LABELS, type CourseType } from '@certify/shared';

// Las fechas sin hora (DATE) llegan como medianoche UTC: se formatean en UTC para no correr un dia.
const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATETIME_FORMAT = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (value: string | null | undefined) => (value ? DATE_FORMAT.format(new Date(value)) : '—');

export const formatDateTime = (value: string | null | undefined) =>
  value ? DATETIME_FORMAT.format(new Date(value)) : '—';

export const courseTypeLabel = (type: CourseType | null | undefined) => (type ? COURSE_TYPE_LABELS[type] : '—');

export const courseTypeOptions = Object.entries(COURSE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

/** Valor de un input date (AAAA-MM-DD) a partir de una fecha ISO. */
export const toDateInput = (value: string | null | undefined) => (value ? value.slice(0, 10) : '');

export const shortUuid = (uuid: string) => `${uuid.slice(0, 8)}...`;

export const plural = (n: number, singular: string, pluralForm = `${singular}s`) =>
  `${n} ${n === 1 ? singular : pluralForm}`;
