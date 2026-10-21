// Vistas globales para el admin. Son agregaciones con GROUP BY / UNION, por eso van en SQL.
import type { AdminCertificatesQuery, AdminEventsQuery } from '@certify/shared';
import { Prisma, prisma } from '../../lib/prisma';

const whereClause = (conditions: Prisma.Sql[]) =>
  conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

const page = (q: { page: number; limit: number }) => Prisma.sql`LIMIT ${q.limit} OFFSET ${(q.page - 1) * q.limit}`;

export const events = async (q: AdminEventsQuery) => {
  const conditions: Prisma.Sql[] = [];
  if (q.dependency_id) conditions.push(Prisma.sql`co.dependency_id = ${q.dependency_id}`);
  if (q.type) conditions.push(Prisma.sql`co.type = ${q.type}::"CourseType"`);
  if (q.date_from) conditions.push(Prisma.sql`co.start_date >= ${q.date_from}::date`);
  if (q.date_to) conditions.push(Prisma.sql`co.end_date <= ${q.date_to}::date`);
  const where = whereClause(conditions);

  const [data, [count]] = await Promise.all([
    prisma.$queryRaw`
      SELECT co.id, co.name, co.type, co.duration_hours, co.instructor,
             co.start_date, co.end_date, co.created_at,
             d.name AS dependency_name, d.abbreviation AS dependency_abbreviation,
             u.full_name AS created_by_name,
             COUNT(DISTINCT cp.participant_id)::int AS participant_count,
             COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid')::int AS certificates_issued
      FROM courses co
      LEFT JOIN dependencies d         ON co.dependency_id = d.id
      LEFT JOIN users u                ON co.created_by = u.id
      LEFT JOIN course_participants cp ON cp.course_id = co.id
      LEFT JOIN certificates cert      ON cert.course_id = co.id
      ${where}
      GROUP BY co.id, d.name, d.abbreviation, u.full_name
      ORDER BY co.created_at DESC
      ${page(q)}`,
    prisma.$queryRaw<{ total: number }[]>`SELECT COUNT(*)::int AS total FROM courses co ${where}`,
  ]);
  return { data, total: count?.total ?? 0, page: q.page, limit: q.limit };
};

export const certificates = async (q: AdminCertificatesQuery) => {
  const conditions: Prisma.Sql[] = [];
  if (q.dependency_id) conditions.push(Prisma.sql`co.dependency_id = ${q.dependency_id}`);
  if (q.status) conditions.push(Prisma.sql`c.status = ${q.status}::"CertificateStatus"`);
  if (q.course_id) conditions.push(Prisma.sql`c.course_id = ${q.course_id}`);
  if (q.date_from) conditions.push(Prisma.sql`c.issue_date >= ${q.date_from}::date`);
  if (q.date_to) conditions.push(Prisma.sql`c.issue_date <= ${q.date_to}::date`);
  const where = whereClause(conditions);

  const [data, [count]] = await Promise.all([
    prisma.$queryRaw`
      SELECT c.id, c.uuid, c.issue_date, c.status, c.revocation_reason, c.revoked_at, c.created_at,
             c.reprint_count, c.course_id, c.participant_id,
             p.full_name AS participant_name,
             co.name AS course_name, co.type AS course_type,
             d.name AS dependency_name,
             ct.name AS template_name,
             u.full_name AS issued_by_name
      FROM certificates c
      LEFT JOIN participants p            ON c.participant_id = p.id
      LEFT JOIN courses co                ON c.course_id = co.id
      LEFT JOIN dependencies d            ON co.dependency_id = d.id
      LEFT JOIN certificate_templates ct  ON c.template_id = ct.id
      LEFT JOIN users u                   ON c.issued_by = u.id
      ${where}
      ORDER BY c.created_at DESC
      ${page(q)}`,
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM certificates c LEFT JOIN courses co ON c.course_id = co.id ${where}`,
  ]);
  return { data, total: count?.total ?? 0, page: q.page, limit: q.limit };
};

/** Actividad reciente: emisiones, reimpresiones, revocaciones, cursos creados y cambios de branding. */
export const activity = async (limit: number) => {
  const data = await prisma.$queryRaw`
    SELECT * FROM (
      SELECT 'certificate_emission' AS type, c.created_at AS event_at, u.full_name AS user_name,
             p.full_name AS subject, co.name AS course_name, d.name AS dependency_name, c.uuid::text AS reference
      FROM certificates c
      LEFT JOIN users u        ON c.issued_by = u.id
      LEFT JOIN participants p ON c.participant_id = p.id
      LEFT JOIN courses co     ON c.course_id = co.id
      LEFT JOIN dependencies d ON co.dependency_id = d.id

      UNION ALL
      SELECT 'certificate_reprint', c.last_reprinted_at, NULL,
             p.full_name, co.name, d.name, c.uuid::text
      FROM certificates c
      LEFT JOIN participants p ON c.participant_id = p.id
      LEFT JOIN courses co     ON c.course_id = co.id
      LEFT JOIN dependencies d ON co.dependency_id = d.id
      WHERE c.last_reprinted_at IS NOT NULL

      UNION ALL
      SELECT 'revocation', rl.revoked_at, u.full_name,
             p.full_name, co.name, d.name, c.uuid::text
      FROM revocation_log rl
      JOIN certificates c      ON rl.certificate_id = c.id
      LEFT JOIN users u        ON rl.revoked_by = u.id
      LEFT JOIN participants p ON c.participant_id = p.id
      LEFT JOIN courses co     ON c.course_id = co.id
      LEFT JOIN dependencies d ON co.dependency_id = d.id

      UNION ALL
      SELECT 'course_creation', co.created_at, u.full_name,
             co.name, co.name, d.name, co.id::text
      FROM courses co
      LEFT JOIN users u        ON co.created_by = u.id
      LEFT JOIN dependencies d ON co.dependency_id = d.id

      UNION ALL
      SELECT 'branding_change', bv.created_at, u.full_name,
             bv.version_label, NULL, NULL, bv.version_label
      FROM branding_versions bv
      LEFT JOIN users u ON bv.created_by = u.id
    ) activity
    ORDER BY event_at DESC
    LIMIT ${limit}`;
  return { data, limit };
};
