// Esquemas Zod de entrada de la API. El backend los usa para validar y el frontend
// para tipar formularios y llamadas. Los nombres de campo siguen el contrato de la API (snake_case).
import { z } from 'zod';
import {
  ATTENDANCE_STATUSES,
  CERTIFICATE_STATUSES,
  COURSE_TYPES,
  ORIENTATIONS,
  PAGE_SIZES,
  ROLES,
} from './enums';

const id = z.coerce.number().int().positive();
const optionalId = z.coerce.number().int().positive().optional();
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hexadecimal valido (#RRGGBB)');
const nonEmpty = (msg: string) => z.string().trim().min(1, msg);
const isoDate = z.iso.date({ error: 'Fecha invalida (AAAA-MM-DD)' }).or(z.iso.datetime());
// Los formularios envian '' para campos opcionales vacios
const emptyToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

// ---------- Comunes ----------
export const idParamSchema = z.object({ id });
export const uuidParamSchema = z.object({ uuid: z.uuid({ error: 'UUID invalido' }) });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

// ---------- Auth ----------
export const loginSchema = z.object({
  email: nonEmpty('Email y password son requeridos'),
  password: nonEmpty('Email y password son requeridos'),
});

// ---------- Usuarios ----------
export const createUserSchema = z
  .object({
    email: z.email({ error: 'Email invalido' }),
    password: z.string().min(8, 'Password debe tener minimo 8 caracteres'),
    full_name: nonEmpty('Nombre completo es requerido'),
    role: z.enum(ROLES, { error: 'Rol debe ser admin o dependencia' }),
    dependency_id: z.coerce.number().int().positive().nullish(),
  })
  .refine((d) => d.role !== 'dependencia' || !!d.dependency_id, {
    path: ['dependency_id'],
    message: 'dependency_id es requerido para el rol dependencia',
  });

export const updateUserSchema = z.object({
  email: z.email({ error: 'Email invalido' }).optional(),
  full_name: nonEmpty('Nombre completo no puede estar vacio').optional(),
  role: z.enum(ROLES, { error: 'Rol debe ser admin o dependencia' }).optional(),
  dependency_id: z.coerce.number().int().positive().nullish(),
  is_active: z.boolean().optional(),
});

// ---------- Dependencias ----------
export const createDependencySchema = z.object({
  name: nonEmpty('Nombre es requerido'),
  abbreviation: z.string().trim().nullish(),
  manager_name: z.string().trim().nullish(),
});

export const updateDependencySchema = z.object({
  name: nonEmpty('Nombre no puede estar vacio').optional(),
  abbreviation: z.string().trim().nullish(),
  manager_name: z.string().trim().nullish(),
  is_active: z.boolean().optional(),
});

export const listDependenciesQuerySchema = z.object({
  active_only: z.enum(['true', 'false']).optional(),
});

// ---------- Tags ----------
export const createTagSchema = z.object({
  name: nonEmpty('Nombre es requerido'),
  slug: nonEmpty('Slug es requerido'),
  description: z.string().nullish(),
});

export const updateTagSchema = z.object({
  name: nonEmpty('Nombre no puede estar vacio').optional(),
  slug: nonEmpty('Slug no puede estar vacio').optional(),
  description: z.string().nullish(),
  is_active: z.boolean().optional(),
});

// ---------- Plantillas ----------
export const createTemplateSchema = z.object({
  name: nonEmpty('Nombre es requerido'),
  slug: nonEmpty('Slug es requerido'),
  description: z.string().nullish(),
  html_content: nonEmpty('Contenido HTML es requerido'),
  orientation: z.enum(ORIENTATIONS, { error: 'Orientacion debe ser landscape o portrait' }).optional(),
  page_size: z.enum(PAGE_SIZES, { error: 'Tamano debe ser letter o A4' }).optional(),
});

// Render HTML del editor con datos de ejemplo (preview en vivo)
export const renderTemplateSchema = z.object({
  html_content: z.string(),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({
  name: nonEmpty('Nombre no puede estar vacio').optional(),
  slug: nonEmpty('Slug no puede estar vacio').optional(),
});

// ---------- Branding ----------
export const createBrandingSchema = z.object({
  version_label: nonEmpty('version_label es requerido'),
  primary_color: hexColor,
  secondary_color: hexColor,
  font_family: nonEmpty('font_family es requerido'),
  organization_name: nonEmpty('organization_name es requerido'),
});

export const updateBrandingSchema = createBrandingSchema.partial();

// ---------- Participantes ----------
export const listParticipantsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  dependency_id: emptyToUndefined(z.coerce.number().int().positive()),
  course_id: emptyToUndefined(z.coerce.number().int().positive()),
  tag_id: emptyToUndefined(z.coerce.number().int().positive()),
});

export const createParticipantSchema = z.object({
  full_name: nonEmpty('El nombre completo es requerido'),
  email: emptyToUndefined(z.email({ error: 'Email invalido' })).nullable(),
  dependency_id: z.coerce.number().int().positive().nullish(),
  tag_ids: z.array(id).optional(),
});

export const updateParticipantSchema = createParticipantSchema.partial().extend({
  full_name: nonEmpty('El nombre no puede estar vacio').optional(),
});

// ---------- Cursos ----------
export const listCoursesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  type: emptyToUndefined(z.enum(COURSE_TYPES)),
});

const courseFields = {
  name: nonEmpty('Nombre es requerido'),
  description: z.string().nullish(),
  type: z.enum(COURSE_TYPES, { error: 'Tipo invalido' }),
  duration_hours: z.coerce.number().int().min(1, 'Duracion debe ser un numero entero positivo').nullish(),
  instructor: z.string().nullish(),
  start_date: isoDate.nullish(),
  end_date: isoDate.nullish(),
  template_id: z.coerce.number().int().positive().nullish(),
};

export const createCourseSchema = z.object({
  ...courseFields,
  dependency_ids: z.array(id).optional(),
});

export const updateCourseSchema = z.object(courseFields).partial().extend({
  name: nonEmpty('Nombre no puede estar vacio').optional(),
});

export const addCourseDependencySchema = z.object({
  dependency_id: id,
  display_order: z.coerce.number().int().min(1).optional(),
});

export const courseDependencyParamsSchema = z.object({ id, depId: id });
export const courseParticipantParamsSchema = z.object({ id, participantId: id });

export const enrollParticipantsSchema = z.object({
  participant_ids: z.array(id).min(1, 'participant_ids debe ser un array con al menos un elemento'),
});

export const updateAttendanceSchema = z.object({
  attendance_status: z.enum(ATTENDANCE_STATUSES, { error: 'attendance_status debe ser: enrolled o completed' }),
});

// Vista previa del certificado del curso con sus datos reales y un participante de ejemplo
export const coursePreviewSchema = z.object({
  template_id: optionalId,
  format: z.enum(['html', 'pdf']).default('html'),
});

// ---------- Certificados ----------
export const listCertificatesQuerySchema = paginationQuerySchema.extend({
  course_id: emptyToUndefined(z.coerce.number().int().positive()),
  participant_id: emptyToUndefined(z.coerce.number().int().positive()),
  status: emptyToUndefined(z.enum(CERTIFICATE_STATUSES)),
});

export const emitCertificatesSchema = z.object({
  course_id: id,
  participant_ids: z.array(id).min(1, 'participant_ids debe ser un array con al menos un elemento'),
  // Si no se envia, se usa la plantilla del curso o la plantilla por defecto
  template_id: optionalId,
});

export const revokeCertificateSchema = z.object({
  reason: nonEmpty('La razon de revocacion es requerida'),
});

// ---------- Admin ----------
export const adminEventsQuerySchema = paginationQuerySchema.extend({
  dependency_id: emptyToUndefined(z.coerce.number().int().positive()),
  type: emptyToUndefined(z.enum(COURSE_TYPES)),
  date_from: emptyToUndefined(isoDate),
  date_to: emptyToUndefined(isoDate),
});

export const adminCertificatesQuerySchema = paginationQuerySchema.extend({
  dependency_id: emptyToUndefined(z.coerce.number().int().positive()),
  course_id: emptyToUndefined(z.coerce.number().int().positive()),
  status: emptyToUndefined(z.enum(CERTIFICATE_STATUSES)),
  date_from: emptyToUndefined(isoDate),
  date_to: emptyToUndefined(isoDate),
});

export const adminActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

// ---------- Tipos inferidos ----------
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
export type UpdateDependencyInput = z.infer<typeof updateDependencySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateBrandingInput = z.infer<typeof createBrandingSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
export type ListParticipantsQuery = z.infer<typeof listParticipantsQuerySchema>;
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ListCertificatesQuery = z.infer<typeof listCertificatesQuerySchema>;
export type CoursePreviewInput = z.infer<typeof coursePreviewSchema>;
export type EmitCertificatesInput = z.infer<typeof emitCertificatesSchema>;
export type AdminEventsQuery = z.infer<typeof adminEventsQuerySchema>;
export type AdminCertificatesQuery = z.infer<typeof adminCertificatesQuerySchema>;
