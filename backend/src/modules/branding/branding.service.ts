import type { CreateBrandingInput, UpdateBrandingInput } from '@certify/shared';
import { conflict, orNotFound } from '../../lib/http-error';
import { prisma, type Prisma } from '../../lib/prisma';

const NOT_FOUND = 'Version de branding no encontrada';
const DEFAULT_LOGO = '/storage/logos/branding/default_logo.png';

const withCreator = { creator: { select: { full_name: true } } } satisfies Prisma.BrandingVersionInclude;

type VersionWithCreator = Prisma.BrandingVersionGetPayload<{ include: typeof withCreator }>;

const toResponse = ({ creator, ...v }: VersionWithCreator) => ({ ...v, created_by_name: creator?.full_name ?? null });

const findOrFail = async (id: number) =>
  orNotFound(await prisma.brandingVersion.findUnique({ where: { id } }), NOT_FOUND);

export const getActive = async () => {
  const active = await prisma.brandingVersion.findFirst({ where: { is_active: true }, include: withCreator });
  return toResponse(orNotFound(active, 'No hay version de branding activa'));
};

export const list = async () =>
  (await prisma.brandingVersion.findMany({ include: withCreator, orderBy: { created_at: 'desc' } })).map(toResponse);

/** Crea una version inactiva; el logo se sube despues. */
export const create = (input: CreateBrandingInput, createdBy: number) =>
  prisma.brandingVersion.create({ data: { ...input, logo_path: DEFAULT_LOGO, is_active: false, created_by: createdBy } });

export const update = async (id: number, input: UpdateBrandingInput) => {
  await findOrFail(id);
  return prisma.brandingVersion.update({ where: { id }, data: input });
};

/** Activa una version y desactiva las demas: siempre hay exactamente una activa. */
export const activate = async (id: number) => {
  await findOrFail(id);
  const [, version] = await prisma.$transaction([
    prisma.brandingVersion.updateMany({ where: { is_active: true }, data: { is_active: false } }),
    prisma.brandingVersion.update({ where: { id }, data: { is_active: true } }),
  ]);
  return { message: 'Version activada', version };
};

export const setLogo = async (id: number, logoPath: string) => {
  await findOrFail(id);
  const version = await prisma.brandingVersion.update({ where: { id }, data: { logo_path: logoPath } });
  return { message: 'Logo actualizado', logo_path: logoPath, version };
};

export const remove = async (id: number) => {
  const version = await findOrFail(id);
  if (version.is_active) throw conflict('No se puede eliminar la version activa. Activa otra version primero.');
  if (await prisma.certificate.count({ where: { branding_version_id: id } })) {
    throw conflict('No se puede eliminar una version usada por certificados emitidos.');
  }
  await prisma.brandingVersion.delete({ where: { id } });
  return { message: 'Version eliminada', id };
};
