// Regla unica de acceso a un curso (y a sus inscripciones y certificados):
// admin siempre; rol dependencia si es la dependencia duena o una colaboradora.
import type { AuthUser } from '../../lib/auth';
import { forbidden, orNotFound } from '../../lib/http-error';
import { prisma, type Prisma } from '../../lib/prisma';

/** Filtro Prisma de cursos visibles para una dependencia. */
export const coursesVisibleTo = (dependencyId: number): Prisma.CourseWhereInput => ({
  OR: [{ dependency_id: dependencyId }, { course_dependencies: { some: { dependency_id: dependencyId } } }],
});

export const canAccessCourse = async (courseId: number, user: AuthUser) => {
  if (user.role === 'admin') return true;
  if (!user.dependency_id) return false;
  const count = await prisma.course.count({ where: { id: courseId, ...coursesVisibleTo(user.dependency_id) } });
  return count > 0;
};

/** Devuelve el curso o lanza 404/403. */
export const getAccessibleCourse = async (courseId: number, user: AuthUser, action = 'gestionar') => {
  const course = orNotFound(await prisma.course.findUnique({ where: { id: courseId } }), 'Curso no encontrado');
  if (!(await canAccessCourse(courseId, user))) throw forbidden(`No tienes permisos para ${action} este curso`);
  return course;
};
