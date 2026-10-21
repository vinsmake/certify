import type { CreateTagInput, UpdateTagInput } from '@certify/shared';
import { conflict, orNotFound } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';

const NOT_FOUND = 'Tag no encontrado';

const findOrFail = async (id: number) => orNotFound(await prisma.tag.findUnique({ where: { id } }), NOT_FOUND);

const assertSlugFree = async (slug: string, exceptId?: number) => {
  const other = await prisma.tag.findUnique({ where: { slug } });
  if (other && other.id !== exceptId) throw conflict('Ya existe un tag con ese slug');
};

export const list = () => prisma.tag.findMany({ orderBy: { created_at: 'desc' } });

export const get = findOrFail;

export const create = async (input: CreateTagInput) => {
  await assertSlugFree(input.slug);
  return prisma.tag.create({ data: { name: input.name, slug: input.slug, description: input.description || null } });
};

export const update = async (id: number, input: UpdateTagInput) => {
  await findOrFail(id);
  if (input.slug) await assertSlugFree(input.slug, id);
  return prisma.tag.update({
    where: { id },
    data: { name: input.name, slug: input.slug, description: input.description, is_active: input.is_active },
  });
};

export const remove = async (id: number) => {
  await findOrFail(id);
  await prisma.tag.delete({ where: { id } });
  return { message: 'Tag eliminado', id };
};

export const setLogo = async (id: number, logoPath: string) => {
  await findOrFail(id);
  await prisma.tag.update({ where: { id }, data: { logo_path: logoPath } });
  return { message: 'Logo actualizado', logo_path: logoPath };
};
