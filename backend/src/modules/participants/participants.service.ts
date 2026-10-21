import type { CreateParticipantInput, ListParticipantsQuery, UpdateParticipantInput } from '@certify/shared';
import type { AuthUser } from '../../lib/auth';
import { forbidden, orNotFound } from '../../lib/http-error';
import { prisma, type Prisma } from '../../lib/prisma';

const NOT_FOUND = 'Participante no encontrado';

const include = {
  dependency: { select: { name: true } },
  participant_tags: {
    select: { tag: { select: { id: true, name: true, slug: true, logo_path: true, created_at: true } } },
  },
} satisfies Prisma.ParticipantInclude;

type ParticipantRow = Prisma.ParticipantGetPayload<{ include: typeof include }>;

const toResponse = ({ dependency, participant_tags, ...p }: ParticipantRow) => ({
  ...p,
  dependency_name: dependency?.name ?? null,
  tags: participant_tags
    .map(({ tag }) => tag)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .map(({ created_at: _c, ...tag }) => tag),
});

/** Rol dependencia solo accede a participantes de su dependencia. */
const assertAccess = (participant: { dependency_id: number | null }, user: AuthUser) => {
  if (user.role !== 'admin' && participant.dependency_id !== user.dependency_id) throw forbidden('Acceso denegado');
};

const findOrFail = async (id: number) =>
  orNotFound(await prisma.participant.findUnique({ where: { id }, include }), NOT_FOUND);

export const list = async (query: ListParticipantsQuery, dependencyId: number | null | undefined) => {
  const where: Prisma.ParticipantWhereInput = {
    ...(dependencyId && { dependency_id: dependencyId }),
    ...(query.course_id && { course_participants: { some: { course_id: query.course_id } } }),
    ...(query.tag_id && { participant_tags: { some: { tag_id: query.tag_id } } }),
    ...(query.search && { full_name: { contains: query.search, mode: 'insensitive' } }),
  };
  const [rows, total] = await prisma.$transaction([
    prisma.participant.findMany({
      where,
      include,
      orderBy: { full_name: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.participant.count({ where }),
  ]);
  return { data: rows.map(toResponse), total, page: query.page, limit: query.limit };
};

export const get = async (id: number, user: AuthUser) => {
  const participant = await findOrFail(id);
  assertAccess(participant, user);
  return toResponse(participant);
};

const tagsData = (tagIds: number[]) => ({ create: tagIds.map((tag_id) => ({ tag_id })) });

export const create = async (input: CreateParticipantInput, user: AuthUser) => {
  const participant = await prisma.participant.create({
    data: {
      full_name: input.full_name,
      email: input.email ?? null,
      // Rol dependencia siempre crea en la suya; admin elige
      dependency_id: user.role === 'dependencia' ? user.dependency_id : (input.dependency_id ?? null),
      ...(input.tag_ids?.length && { participant_tags: tagsData(input.tag_ids) }),
    },
    include,
  });
  return toResponse(participant);
};

export const update = async (id: number, input: UpdateParticipantInput, user: AuthUser) => {
  assertAccess(await findOrFail(id), user);
  const participant = await prisma.participant.update({
    where: { id },
    data: {
      full_name: input.full_name,
      email: input.email,
      dependency_id: user.role === 'dependencia' ? user.dependency_id : input.dependency_id,
      // tag_ids presente = reemplazar todos los tags
      ...(input.tag_ids !== undefined && { participant_tags: { deleteMany: {}, ...tagsData(input.tag_ids) } }),
    },
    include,
  });
  return toResponse(participant);
};

export const remove = async (id: number, user: AuthUser) => {
  assertAccess(await findOrFail(id), user);
  await prisma.participant.delete({ where: { id } });
  return { message: 'Participante eliminado', id };
};

export const certificates = async (id: number, user: AuthUser) => {
  const participant = await findOrFail(id);
  assertAccess(participant, user);
  const rows = await prisma.certificate.findMany({
    where: { participant_id: id },
    include: {
      course: { select: { name: true, type: true, duration_hours: true } },
      template: { select: { name: true } },
    },
    orderBy: { issue_date: 'desc' },
  });
  return {
    participant: toResponse(participant),
    certificates: rows.map((c) => ({
      id: c.id,
      uuid: c.uuid,
      issue_date: c.issue_date,
      status: c.status,
      revocation_reason: c.revocation_reason,
      revoked_at: c.revoked_at,
      course_id: c.course_id,
      course_name: c.course.name,
      course_type: c.course.type,
      duration_hours: c.course.duration_hours,
      template_name: c.template?.name ?? null,
    })),
  };
};
