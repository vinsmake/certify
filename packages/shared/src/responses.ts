// Formas de las respuestas JSON de la API (el contrato que consume el frontend).
// Las fechas llegan serializadas como string ISO. Si el backend cambia una respuesta,
// hay que actualizar aqui; el typecheck del frontend avisa donde se usa.
import type {
  AttendanceStatus,
  CertificateStatus,
  CourseType,
  Orientation,
  PageSize,
  Role,
} from './enums';

type IsoDate = string;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface MessageResponse {
  message: string;
}

// ---------- Auth / usuarios ----------

export interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  dependency_id: number | null;
  dependency_name: string | null;
  is_active: boolean;
}

export interface LoginResponse {
  token: string;
  user: Omit<CurrentUser, 'dependency_name' | 'is_active'>;
}

export interface UserItem {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  dependency_id: number | null;
  dependency_name?: string | null;
  is_active: boolean;
  created_at?: IsoDate;
  updated_at?: IsoDate;
}

// ---------- Dependencias y tags ----------

export interface Dependency {
  id: number;
  name: string;
  abbreviation: string | null;
  is_active: boolean;
  created_at: IsoDate;
  updated_at: IsoDate;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_path: string | null;
  is_active: boolean;
  created_at: IsoDate;
  updated_at: IsoDate;
}

export type TagSummary = Pick<Tag, 'id' | 'name' | 'slug' | 'logo_path'>;

// ---------- Plantillas base ----------

export interface TemplateSummary {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  orientation: Orientation;
  page_size: PageSize;
  thumbnail_path: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: IsoDate;
  created_by: number | null;
}

export interface Template extends TemplateSummary {
  html_content: string;
}

// ---------- Participantes ----------

export interface Participant {
  id: number;
  full_name: string;
  email: string | null;
  dependency_id: number | null;
  dependency_name: string | null;
  tags: TagSummary[];
  created_at: IsoDate;
  updated_at: IsoDate;
}

export interface ParticipantCertificate {
  id: number;
  uuid: string;
  issue_date: IsoDate;
  status: CertificateStatus;
  revocation_reason: string | null;
  revoked_at: IsoDate | null;
  course_id: number;
  course_name: string;
  course_type: CourseType;
  duration_hours: number | null;
}

export interface ParticipantCertificatesResponse {
  participant: Participant;
  certificates: ParticipantCertificate[];
}

// ---------- Cursos ----------

export interface Course {
  id: number;
  name: string;
  description: string | null;
  type: CourseType;
  duration_hours: number | null;
  instructor: string | null;
  signature_path: string | null;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  dependency_id: number | null;
  created_by: number | null;
  created_at: IsoDate;
  updated_at: IsoDate;
  // Diseño del certificado (el HTML solo viene en el detalle)
  orientation: Orientation;
  page_size: PageSize;
  logo_path: string | null;
  organization_name: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

export interface CourseListItem extends Course {
  created_by_name: string | null;
  dependencies: { id: number; name: string }[];
}

export interface CourseDependency {
  id: number;
  course_id: number;
  dependency_id: number;
  display_order: number;
  dependency_name: string;
  abbreviation: string | null;
  /** Logo, firma y firmante de la colaboradora en ESTE curso */
  logo_path: string | null;
  signature_path: string | null;
  signer_name: string | null;
}

export interface CourseDetail extends Omit<CourseListItem, 'dependencies'> {
  certificate_html: string;
  dependencies: CourseDependency[];
}

export interface CoursePreview {
  html: string;
  orientation: Orientation;
  page_size: PageSize;
}

export interface EnrollmentCertificate {
  id: number;
  uuid: string;
  status: CertificateStatus;
  issue_date: IsoDate;
}

export interface Enrollment {
  id: number;
  enrollment_date: IsoDate;
  attendance_status: AttendanceStatus;
  participant_id: number;
  full_name: string;
  email: string | null;
  dependency_id: number | null;
  dependency_name: string | null;
  /** Certificado valido del participante en el curso o, si no tiene, el ultimo revocado. */
  certificate: EnrollmentCertificate | null;
}

export interface CourseParticipantsResponse {
  course_id: number;
  course_name: string;
  participants: Enrollment[];
}

export interface EnrollResponse {
  enrolled: number[];
  already_enrolled: number[];
  not_found: number[];
}

// ---------- Certificados ----------

export interface CertificateListItem {
  id: number;
  uuid: string;
  issue_date: IsoDate;
  status: CertificateStatus;
  pdf_path: string | null;
  revocation_reason: string | null;
  revoked_at: IsoDate | null;
  reprint_count: number;
  last_reprinted_at: IsoDate | null;
  created_at: IsoDate;
  participant_id: number;
  participant_name: string;
  course_id: number;
  course_name: string;
  course_type: CourseType;
  dependency_id: number | null;
  dependency_name: string | null;
  issued_by_name: string | null;
}

export interface CertificateDetail {
  id: number;
  uuid: string;
  participant_id: number;
  course_id: number;
  issued_by: number | null;
  issue_date: IsoDate;
  pdf_path: string | null;
  status: CertificateStatus;
  revocation_reason: string | null;
  revoked_at: IsoDate | null;
  revoked_by: number | null;
  reprint_count: number;
  last_reprinted_at: IsoDate | null;
  created_at: IsoDate;
  participant_name: string;
  participant_email: string | null;
  course_name: string;
  course_type: CourseType;
  duration_hours: number | null;
  instructor: string | null;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  dependency_id: number | null;
  dependency_name: string | null;
  issued_by_name: string | null;
}

export interface EmitResponse {
  emitted: { participant_id: number; certificate_id: number; uuid: string }[];
  already_exists: number[];
  errors: { participant_id: number; reason: string }[];
}

export interface ReprintResponse {
  message: string;
  certificate: CertificateDetail;
}

// ---------- Verificacion publica ----------

export interface VerificationResponse {
  status: 'VALIDO' | 'REVOCADO';
  certificate: {
    uuid: string;
    issue_date: IsoDate;
    revoked_at?: IsoDate | null;
    revocation_reason?: string | null;
    participant: { full_name: string; organization: string | null; position: string | null };
    course: {
      name: string;
      type: CourseType;
      duration_hours: number | null;
      instructor: string | null;
      start_date: IsoDate | null;
      end_date: IsoDate | null;
    };
    /** Organizacion emisora segun el diseño del curso */
    organization: { name: string | null; logo_path: string | null };
    dependencies: { name: string; abbreviation: string | null; logo_path: string | null; display_order: number }[];
  };
}

// ---------- Estadisticas ----------

export interface DependencyStats {
  total_courses: number;
  total_participants: number;
  total_certificates: number;
  certificates_valid: number;
  certificates_revoked: number;
  total_users?: number;
}

export interface GlobalStats {
  totals: {
    courses: number;
    participants: number;
    certificates: number;
    certificates_valid: number;
    certificates_revoked: number;
  };
  by_dependency: ({ id: number; name: string; abbreviation: string | null } & Omit<
    DependencyStats,
    'total_participants'
  >)[];
}

export interface MyStats {
  dependency: { id: number; name: string; abbreviation: string | null };
  stats: DependencyStats;
}

// ---------- Vistas globales (admin) ----------

export interface AdminEvent {
  id: number;
  name: string;
  type: CourseType;
  duration_hours: number | null;
  instructor: string | null;
  start_date: IsoDate | null;
  end_date: IsoDate | null;
  created_at: IsoDate;
  dependency_name: string | null;
  dependency_abbreviation: string | null;
  created_by_name: string | null;
  participant_count: number;
  certificates_issued: number;
}

export interface AdminCertificate {
  id: number;
  uuid: string;
  issue_date: IsoDate;
  status: CertificateStatus;
  revocation_reason: string | null;
  revoked_at: IsoDate | null;
  created_at: IsoDate;
  reprint_count: number;
  course_id: number;
  participant_id: number;
  participant_name: string | null;
  course_name: string | null;
  course_type: CourseType | null;
  dependency_name: string | null;
  issued_by_name: string | null;
}

export type ActivityType = 'certificate_emission' | 'certificate_reprint' | 'revocation' | 'course_creation';

export interface ActivityItem {
  type: ActivityType;
  event_at: IsoDate;
  user_name: string | null;
  subject: string | null;
  course_name: string | null;
  dependency_name: string | null;
  reference: string | null;
}

/** Cuerpo de error de la API. */
export interface ApiErrorBody {
  error: string;
  details?: { field: string; message: string }[];
}
