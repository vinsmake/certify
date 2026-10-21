// Valores de dominio compartidos entre backend y frontend.

export const ROLES = ['admin', 'dependencia'] as const;
export type Role = (typeof ROLES)[number];

export const COURSE_TYPES = ['curso', 'charla', 'taller', 'seminario', 'diploma'] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  curso: 'Curso',
  charla: 'Charla',
  taller: 'Taller',
  seminario: 'Seminario',
  diploma: 'Diploma',
};

export const ATTENDANCE_STATUSES = ['enrolled', 'completed'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const CERTIFICATE_STATUSES = ['valid', 'revoked'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const ORIENTATIONS = ['landscape', 'portrait'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const PAGE_SIZES = ['letter', 'A4'] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
