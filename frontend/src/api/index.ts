// Funciones tipadas para cada endpoint de la API, agrupadas por dominio.
// Los tipos de entrada vienen de los esquemas Zod de @certify/shared y los de salida
// del contrato de respuestas (packages/shared/src/responses.ts).
import type {
  ActivityItem,
  AdminCertificate,
  AdminEvent,
  BrandingVersion,
  CertificateDetail,
  CertificateListItem,
  CertificateStatus,
  Course,
  CourseDependency,
  CourseDetail,
  CourseListItem,
  CourseParticipantsResponse,
  CourseType,
  CreateBrandingInput,
  CreateCourseInput,
  CreateDependencyInput,
  CreateParticipantInput,
  CreateTagInput,
  CreateTemplateInput,
  CreateUserInput,
  CurrentUser,
  Dependency,
  EmitCertificatesInput,
  EmitResponse,
  EnrollResponse,
  GlobalStats,
  LoginResponse,
  MessageResponse,
  MyStats,
  Orientation,
  PageSize,
  Paginated,
  Participant,
  ParticipantCertificatesResponse,
  AttendanceStatus,
  ReprintResponse,
  Tag,
  Template,
  TemplateSummary,
  UpdateBrandingInput,
  UpdateCourseInput,
  UpdateDependencyInput,
  UpdateParticipantInput,
  UpdateTagInput,
  UpdateTemplateInput,
  UpdateUserInput,
  UserItem,
  VerificationResponse,
} from '@certify/shared';
import { http } from '../lib/http';

/** Parametros de query: los valores vacios no se envian. */
type Query = Record<string, string | number | undefined>;

const get = <T>(url: string, params?: Query) => http.get<T>(url, { params }).then((r) => r.data);
const post = <T>(url: string, body?: unknown) => http.post<T>(url, body).then((r) => r.data);
const put = <T>(url: string, body?: unknown) => http.put<T>(url, body).then((r) => r.data);
const del = <T>(url: string) => http.delete<T>(url).then((r) => r.data);
const getBlob = (url: string) => http.get<Blob>(url, { responseType: 'blob' }).then((r) => r.data);
const postBlob = (url: string, body?: unknown) =>
  http.post<Blob>(url, body ?? {}, { responseType: 'blob' }).then((r) => r.data);

const upload = <T>(url: string, field: string, file: File) => {
  const form = new FormData();
  form.append(field, file);
  return http.post<T>(url, form).then((r) => r.data);
};

export interface PageQuery {
  page?: number;
  limit?: number;
}

export const authApi = {
  login: (email: string, password: string) => post<LoginResponse>('/auth/login', { email, password }),
  me: () => get<CurrentUser>('/auth/me'),
};

export const statsApi = {
  global: () => get<GlobalStats>('/stats'),
  mine: () => get<MyStats>('/stats/me'),
};

export const courseApi = {
  list: (q: PageQuery & { search?: string; type?: CourseType | '' }) =>
    get<Paginated<CourseListItem>>('/courses', { ...q, type: q.type || undefined, search: q.search || undefined }),
  get: (id: number) => get<CourseDetail>(`/courses/${id}`),
  create: (data: CreateCourseInput) => post<Course>('/courses', data),
  update: (id: number, data: UpdateCourseInput) => put<Course>(`/courses/${id}`, data),
  remove: (id: number) => del<MessageResponse>(`/courses/${id}`),

  addDependency: (id: number, dependencyId: number) =>
    post<CourseDependency>(`/courses/${id}/dependencies`, { dependency_id: dependencyId }),
  removeDependency: (id: number, dependencyId: number) =>
    del<MessageResponse>(`/courses/${id}/dependencies/${dependencyId}`),

  participants: (id: number) => get<CourseParticipantsResponse>(`/courses/${id}/participants`),
  enroll: (id: number, participantIds: number[]) =>
    post<EnrollResponse>(`/courses/${id}/participants`, { participant_ids: participantIds }),
  setAttendance: (id: number, participantId: number, status: AttendanceStatus) =>
    put<unknown>(`/courses/${id}/participants/${participantId}`, { attendance_status: status }),
  unenroll: (id: number, participantId: number) => del<MessageResponse>(`/courses/${id}/participants/${participantId}`),

  uploadSignature: (id: number, file: File) => upload<MessageResponse>(`/courses/${id}/signature`, 'signature', file),
  deleteSignature: (id: number) => del<MessageResponse>(`/courses/${id}/signature`),

  previewHtml: (id: number, templateId?: number) =>
    post<CoursePreview>(`/courses/${id}/certificate-preview`, { template_id: templateId, format: 'html' }),
  previewPdf: (id: number, templateId?: number) =>
    postBlob(`/courses/${id}/certificate-preview`, { template_id: templateId, format: 'pdf' }),
};

export interface CoursePreview {
  html: string;
  template_id: number;
  template_name: string;
  orientation: Orientation;
  page_size: PageSize;
}

export const participantApi = {
  list: (q: PageQuery & { search?: string; dependency_id?: string; course_id?: string; tag_id?: string }) =>
    get<Paginated<Participant>>('/participants', {
      ...q,
      search: q.search || undefined,
      dependency_id: q.dependency_id || undefined,
      course_id: q.course_id || undefined,
      tag_id: q.tag_id || undefined,
    }),
  create: (data: CreateParticipantInput) => post<Participant>('/participants', data),
  update: (id: number, data: UpdateParticipantInput) => put<Participant>(`/participants/${id}`, data),
  remove: (id: number) => del<MessageResponse>(`/participants/${id}`),
  certificates: (id: number) => get<ParticipantCertificatesResponse>(`/participants/${id}/certificates`),
};

export const certificateApi = {
  list: (q: PageQuery & { course_id?: number | string; participant_id?: number; status?: CertificateStatus | '' }) =>
    get<Paginated<CertificateListItem>>('/certificates', {
      ...q,
      course_id: q.course_id || undefined,
      status: q.status || undefined,
    }),
  get: (id: number) => get<CertificateDetail>(`/certificates/${id}`),
  emit: (data: EmitCertificatesInput) => post<EmitResponse>('/certificates/emit', data),
  reprint: (id: number) => post<ReprintResponse>(`/certificates/${id}/reprint`),
  revoke: (id: number, reason: string) => post<MessageResponse>(`/certificates/${id}/revoke`, { reason }),
  pdf: (id: number) => getBlob(`/certificates/${id}/download`),
};

export const dependencyApi = {
  list: (activeOnly = false) => get<Dependency[]>('/dependencies', activeOnly ? { active_only: 'true' } : undefined),
  create: (data: CreateDependencyInput) => post<Dependency>('/dependencies', data),
  update: (id: number, data: UpdateDependencyInput) => put<Dependency>(`/dependencies/${id}`, data),
  deactivate: (id: number) => del<MessageResponse>(`/dependencies/${id}`),
  uploadLogo: (id: number, file: File) => upload<MessageResponse>(`/dependencies/${id}/logo`, 'logo', file),
  uploadSignature: (id: number, file: File) =>
    upload<MessageResponse>(`/dependencies/${id}/signature`, 'signature', file),
  deleteSignature: (id: number) => del<MessageResponse>(`/dependencies/${id}/signature`),
};

export const tagApi = {
  list: () => get<Tag[]>('/tags'),
  create: (data: CreateTagInput) => post<Tag>('/tags', data),
  update: (id: number, data: UpdateTagInput) => put<Tag>(`/tags/${id}`, data),
  remove: (id: number) => del<MessageResponse>(`/tags/${id}`),
  uploadLogo: (id: number, file: File) => upload<MessageResponse>(`/tags/${id}/logo`, 'logo', file),
};

export const templateApi = {
  list: () => get<TemplateSummary[]>('/templates'),
  get: (id: number) => get<Template>(`/templates/${id}`),
  create: (data: CreateTemplateInput) => post<Template>('/templates', data),
  update: (id: number, data: UpdateTemplateInput) => put<Template>(`/templates/${id}`, data),
  deactivate: (id: number) => del<MessageResponse>(`/templates/${id}`),
  setDefault: (id: number) => put<MessageResponse>(`/templates/${id}/default`),
  previewPdf: (id: number) => postBlob(`/templates/${id}/preview`),
  renderSample: (htmlContent: string) => post<{ html: string }>('/templates/render', { html_content: htmlContent }),
};

export const userApi = {
  list: () => get<UserItem[]>('/users'),
  create: (data: CreateUserInput) => post<UserItem>('/users', data),
  update: (id: number, data: UpdateUserInput) => put<UserItem>(`/users/${id}`, data),
  deactivate: (id: number) => del<MessageResponse>(`/users/${id}`),
};

export const brandingApi = {
  active: () => get<BrandingVersion | null>('/branding/active'),
  versions: () => get<BrandingVersion[]>('/branding/versions'),
  create: (data: CreateBrandingInput) => post<BrandingVersion>('/branding/versions', data),
  update: (id: number, data: UpdateBrandingInput) => put<BrandingVersion>(`/branding/versions/${id}`, data),
  activate: (id: number) => put<BrandingVersion>(`/branding/versions/${id}/activate`),
  remove: (id: number) => del<MessageResponse>(`/branding/versions/${id}`),
  uploadLogo: (id: number, file: File) => upload<MessageResponse>(`/branding/versions/${id}/logo`, 'logo', file),
};

export const adminApi = {
  events: (q: PageQuery & { type?: CourseType | '' }) =>
    get<Paginated<AdminEvent>>('/admin/events', { ...q, type: q.type || undefined }),
  certificates: (q: PageQuery & { status?: CertificateStatus | '' }) =>
    get<Paginated<AdminCertificate>>('/admin/certificates', { ...q, status: q.status || undefined }),
  activity: (limit = 100) => get<{ data: ActivityItem[]; limit: number }>('/admin/activity', { limit }),
};

export const verifyApi = {
  get: (uuid: string) => get<VerificationResponse>(`/verify/${uuid}`),
};
