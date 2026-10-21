import { orNotFound } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';

interface DependencyStatsRow {
  total_courses: number;
  total_participants: number;
  total_certificates: number;
  certificates_valid: number;
  certificates_revoked: number;
  total_users: number;
}

export const globalStats = async () => {
  const [totals] = await prisma.$queryRaw<
    { courses: number; participants: number; certificates: number; valid: number; revoked: number }[]
  >`
    SELECT
      (SELECT COUNT(*) FROM courses)::int                                  AS courses,
      (SELECT COUNT(*) FROM participants)::int                             AS participants,
      (SELECT COUNT(*) FROM certificates)::int                             AS certificates,
      (SELECT COUNT(*) FROM certificates WHERE status = 'valid')::int      AS valid,
      (SELECT COUNT(*) FROM certificates WHERE status = 'revoked')::int    AS revoked`;

  const byDependency = await prisma.$queryRaw<
    ({ id: number; name: string; abbreviation: string | null } & Omit<DependencyStatsRow, 'total_participants'>)[]
  >`
    SELECT d.id, d.name, d.abbreviation,
      COUNT(DISTINCT co.id)::int                                             AS total_courses,
      COUNT(DISTINCT cert.id)::int                                           AS total_certificates,
      COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid')::int     AS certificates_valid,
      COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'revoked')::int   AS certificates_revoked,
      COUNT(DISTINCT u.id)::int                                              AS total_users
    FROM dependencies d
    LEFT JOIN courses co        ON co.dependency_id = d.id
    LEFT JOIN certificates cert ON cert.course_id = co.id
    LEFT JOIN users u           ON u.dependency_id = d.id AND u.is_active = true
    WHERE d.is_active = true
    GROUP BY d.id, d.name, d.abbreviation
    ORDER BY d.name`;

  return {
    totals: {
      courses: totals?.courses ?? 0,
      participants: totals?.participants ?? 0,
      certificates: totals?.certificates ?? 0,
      certificates_valid: totals?.valid ?? 0,
      certificates_revoked: totals?.revoked ?? 0,
    },
    by_dependency: byDependency,
  };
};

const statsForDependency = async (dependencyId: number) => {
  const [stats] = await prisma.$queryRaw<DependencyStatsRow[]>`
    SELECT
      COUNT(DISTINCT co.id)::int                                             AS total_courses,
      COUNT(DISTINCT cp.participant_id)::int                                 AS total_participants,
      COUNT(DISTINCT cert.id)::int                                           AS total_certificates,
      COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid')::int     AS certificates_valid,
      COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'revoked')::int   AS certificates_revoked,
      COUNT(DISTINCT u.id)::int                                              AS total_users
    FROM dependencies d
    LEFT JOIN courses co             ON co.dependency_id = d.id
    LEFT JOIN course_participants cp ON cp.course_id = co.id
    LEFT JOIN certificates cert      ON cert.course_id = co.id
    LEFT JOIN users u                ON u.dependency_id = d.id AND u.is_active = true
    WHERE d.id = ${dependencyId}`;
  return stats as DependencyStatsRow;
};

const dependencySummary = async (id: number, onlyActive: boolean) =>
  orNotFound(
    await prisma.dependency.findFirst({
      where: { id, ...(onlyActive && { is_active: true }) },
      select: { id: true, name: true, abbreviation: true },
    }),
    'Dependencia no encontrada',
  );

export const dependencyStats = async (id: number) => ({
  dependency: await dependencySummary(id, true),
  stats: await statsForDependency(id),
});

/** Estadisticas de la dependencia del usuario (sin total_users, como antes). */
export const myStats = async (dependencyId: number) => {
  const dependency = await dependencySummary(dependencyId, false);
  const { total_users: _users, ...stats } = await statsForDependency(dependencyId);
  return { dependency, stats };
};
