import type { AttendanceStatus, CreateCourseInput, ListCoursesQuery, UpdateCourseInput } from '@certify/shared';
import type { AuthUser } from '../../lib/auth';
import { badRequest, conflict, forbidden, notFound, orNotFound } from '../../lib/http-error';
import { prisma, type Prisma } from '../../lib/prisma';
import { coursesVisibleTo, getAccessibleCourse } from './course-access';

const listInclude = {
  creator: { select: { full_name: true } },
  template: { select: { name: true } },
  course_dependencies: {
    select: { dependency: { select: { id: true, name: true } } },
    orderBy: { display_order: 'asc' },
  },
} satisfies Prisma.CourseInclude;

type CourseListRow = Prisma.CourseGetPayload<{ include: typeof listInclude }>;

const toListItem = ({ creator, template, course_dependencies, ...c }: CourseListRow) => ({
  ...c,
  template_name: template?.name ?? null,
  created_by_name: creator?.full_name ?? null,
  dependencies: course_dependencies.map((cd) => cd.dependency),
});

/** Dependencias colaboradoras con los datos que usa el certificado (logo, encargado, firma). */
export const courseDependencies = async (courseId: number) => {
  const rows = await prisma.courseDependency.findMany({
    where: { course_id: courseId },
    include: { dependency: true },
    orderBy: { display_order: 'asc' },
  });
  return rows.map(({ dependency: d, ...cd }) => ({
    ...cd,
    dependency_name: d.name,
    abbreviation: d.abbreviation,
    logo_path: d.logo_path,
    manager_name: d.manager_name,
    signature_path: d.signature_path,
  }));
};

const assertTemplateUsable = async (templateId: number | null | undefined) => {
  if (!templateId) return;
  const template = await prisma.certificateTemplate.findUnique({ where: { id: templateId } });
  if (!template?.is_active) throw badRequest('La plantilla seleccionada no existe o esta inactiva');
};

export const list = async (query: ListCoursesQuery, dependencyId: number | null | undefined) => {
  const where: Prisma.CourseWhereInput = {
    ...(dependencyId && coursesVisibleTo(dependencyId)),
    ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
    ...(query.type && { type: query.type }),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      include: listInclude,
      orderBy: { created_at: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.course.count({ where }),
  ]);
  return { data: rows.map(toListItem), total, page: query.page, limit: query.limit };
};

export const get = async (id: number, user: AuthUser) => {
  await getAccessibleCourse(id, user, 'ver');
  const course = await prisma.course.findUniqueOrThrow({ where: { id }, include: listInclude });
  return { ...toListItem(course), dependencies: await courseDependencies(id) };
};

export const create = async (input: CreateCourseInput, user: AuthUser) => {
  await assertTemplateUsable(input.template_id);
  const isDependencia = user.role === 'dependencia';
  // La dependencia del usuario creador es la duena y siempre colaboradora;
  // admin crea cursos sin dueno y elige colaboradoras.
  const collaborators = isDependencia ? [user.dependency_id as number] : [...new Set(input.dependency_ids ?? [])];

  return prisma.course.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      duration_hours: input.duration_hours ?? null,
      instructor: input.instructor ?? null,
      start_date: input.start_date ? new Date(input.start_date) : null,
      end_date: input.end_date ? new Date(input.end_date) : null,
      template_id: input.template_id ?? null,
      dependency_id: isDependencia ? user.dependency_id : null,
      created_by: user.userId,
      course_dependencies: { create: collaborators.map((dependency_id) => ({ dependency_id })) },
    },
  });
};

const optionalDate = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);

export const update = async (id: number, input: UpdateCourseInput, user: AuthUser) => {
  await getAccessibleCourse(id, user, 'editar');
  await assertTemplateUsable(input.template_id);
  return prisma.course.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      type: input.type,
      duration_hours: input.duration_hours,
      instructor: input.instructor,
      start_date: optionalDate(input.start_date),
      end_date: optionalDate(input.end_date),
      template_id: input.template_id,
    },
  });
};

export const remove = async (id: number, user: AuthUser) => {
  await getAccessibleCourse(id, user, 'eliminar');
  if (await prisma.certificate.count({ where: { course_id: id } })) {
    throw conflict('No se puede eliminar un curso con certificados emitidos. Revoca los certificados si es necesario.');
  }
  await prisma.course.delete({ where: { id } });
  return { message: 'Curso eliminado', id };
};

// ---------- Dependencias colaboradoras (solo admin) ----------

const assertAdmin = (user: AuthUser) => {
  if (user.role !== 'admin') throw forbidden('Solo el administrador puede gestionar dependencias colaboradoras');
};

export const addDependency = async (id: number, dependencyId: number, displayOrder: number | undefined, user: AuthUser) => {
  assertAdmin(user);
  orNotFound(await prisma.course.findUnique({ where: { id } }), 'Curso no encontrado');
  orNotFound(await prisma.dependency.findUnique({ where: { id: dependencyId } }), 'Dependencia no encontrada');
  const existing = await prisma.courseDependency.findUnique({
    where: { course_id_dependency_id: { course_id: id, dependency_id: dependencyId } },
  });
  if (existing) throw conflict('Esta dependencia ya esta asociada al curso');
  return prisma.courseDependency.create({
    data: { course_id: id, dependency_id: dependencyId, display_order: displayOrder ?? 1 },
  });
};

export const removeDependency = async (id: number, dependencyId: number, user: AuthUser) => {
  assertAdmin(user);
  const { count } = await prisma.courseDependency.deleteMany({ where: { course_id: id, dependency_id: dependencyId } });
  if (!count) throw notFound('Asociacion no encontrada');
  return { message: 'Dependencia removida del curso' };
};

// ---------- Inscripciones ----------

export const participants = async (id: number, user: AuthUser) => {
  const course = await getAccessibleCourse(id, user, 'ver');
  const [enrollments, certificates] = await Promise.all([
    prisma.courseParticipant.findMany({
      where: { course_id: id },
      include: { participant: { include: { dependency: { select: { name: true } } } } },
      orderBy: { participant: { full_name: 'asc' } },
    }),
    prisma.certificate.findMany({
      where: { course_id: id },
      select: { id: true, uuid: true, status: true, participant_id: true, issue_date: true },
      orderBy: { created_at: 'asc' },
    }),
  ]);

  // Por participante: su certificado valido o, si no tiene, el ultimo revocado
  const certByParticipant = new Map<number, (typeof certificates)[number]>();
  for (const cert of certificates) {
    const current = certByParticipant.get(cert.participant_id);
    if (!current || current.status !== 'valid') certByParticipant.set(cert.participant_id, cert);
  }

  return {
    course_id: course.id,
    course_name: course.name,
    participants: enrollments.map(({ participant: p, ...cp }) => {
      const cert = certByParticipant.get(p.id);
      return {
        id: cp.id,
        enrollment_date: cp.enrollment_date,
        attendance_status: cp.attendance_status,
        participant_id: p.id,
        full_name: p.full_name,
        email: p.email,
        dependency_id: p.dependency_id,
        dependency_name: p.dependency?.name ?? null,
        certificate: cert ? { id: cert.id, uuid: cert.uuid, status: cert.status, issue_date: cert.issue_date } : null,
      };
    }),
  };
};

export const enroll = async (id: number, participantIds: number[], user: AuthUser) => {
  await getAccessibleCourse(id, user);
  const results = { enrolled: [] as number[], already_enrolled: [] as number[], not_found: [] as number[] };
  const ids = [...new Set(participantIds)];

  const [existingParticipants, existingEnrollments] = await Promise.all([
    prisma.participant.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    prisma.courseParticipant.findMany({
      where: { course_id: id, participant_id: { in: ids } },
      select: { participant_id: true },
    }),
  ]);
  const found = new Set(existingParticipants.map((p) => p.id));
  const enrolled = new Set(existingEnrollments.map((e) => e.participant_id));

  for (const pid of ids) {
    if (!found.has(pid)) results.not_found.push(pid);
    else if (enrolled.has(pid)) results.already_enrolled.push(pid);
    else results.enrolled.push(pid);
  }
  if (results.enrolled.length) {
    await prisma.courseParticipant.createMany({
      data: results.enrolled.map((participant_id) => ({ course_id: id, participant_id })),
    });
  }
  return results;
};

export const updateAttendance = async (id: number, participantId: number, status: AttendanceStatus, user: AuthUser) => {
  await getAccessibleCourse(id, user);
  const enrollment = orNotFound(
    await prisma.courseParticipant.findUnique({
      where: { course_id_participant_id: { course_id: id, participant_id: participantId } },
    }),
    'Inscripcion no encontrada',
  );
  return prisma.courseParticipant.update({ where: { id: enrollment.id }, data: { attendance_status: status } });
};

export const unenroll = async (id: number, participantId: number, user: AuthUser) => {
  await getAccessibleCourse(id, user);
  const hasCertificate = await prisma.certificate.count({
    where: { course_id: id, participant_id: participantId, status: 'valid' },
  });
  if (hasCertificate) throw conflict('El participante ya tiene un certificado valido en este curso. Revocalo primero.');
  const { count } = await prisma.courseParticipant.deleteMany({ where: { course_id: id, participant_id: participantId } });
  if (!count) throw notFound('Inscripcion no encontrada');
  return { message: 'Participante dado de baja del curso' };
};

// ---------- Firma del instructor ----------

export const setSignature = async (id: number, signaturePath: string | null, user: AuthUser) => {
  await getAccessibleCourse(id, user, 'editar');
  const course = await prisma.course.update({ where: { id }, data: { signature_path: signaturePath } });
  return signaturePath
    ? { message: 'Firma actualizada', signature_path: signaturePath, course }
    : { message: 'Firma eliminada', course };
};
