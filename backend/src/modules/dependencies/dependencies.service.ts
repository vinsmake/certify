import type { CreateDependencyInput, UpdateDependencyInput } from '@certify/shared';
import { orNotFound } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';

const NOT_FOUND = 'Dependencia no encontrada';

const findOrFail = async (id: number) =>
  orNotFound(await prisma.dependency.findUnique({ where: { id } }), NOT_FOUND);

export const list = (activeOnly: boolean) =>
  prisma.dependency.findMany({ where: activeOnly ? { is_active: true } : {}, orderBy: { name: 'asc' } });

export const get = findOrFail;

export const create = (input: CreateDependencyInput) =>
  prisma.dependency.create({
    data: { name: input.name, abbreviation: input.abbreviation || null, manager_name: input.manager_name || null },
  });

export const update = async (id: number, input: UpdateDependencyInput) => {
  await findOrFail(id);
  return prisma.dependency.update({
    where: { id },
    data: {
      name: input.name,
      abbreviation: input.abbreviation,
      manager_name: input.manager_name,
      is_active: input.is_active,
    },
  });
};

export const deactivate = async (id: number) => {
  await findOrFail(id);
  await prisma.dependency.update({ where: { id }, data: { is_active: false } });
  return { message: 'Dependencia desactivada', id };
};

export const setLogo = async (id: number, logoPath: string) => {
  await findOrFail(id);
  await prisma.dependency.update({ where: { id }, data: { logo_path: logoPath } });
  return { message: 'Logo actualizado', logo_path: logoPath };
};

export const setSignature = async (id: number, signaturePath: string | null) => {
  await findOrFail(id);
  await prisma.dependency.update({ where: { id }, data: { signature_path: signaturePath } });
  return signaturePath
    ? { message: 'Firma actualizada', signature_path: signaturePath }
    : { message: 'Firma eliminada' };
};
