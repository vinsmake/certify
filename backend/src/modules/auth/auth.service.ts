import { comparePassword, signToken } from '../../lib/auth';
import { HttpError, orNotFound } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, 'Credenciales incorrectas');
  if (!user.is_active) throw new HttpError(401, 'Usuario desactivado');
  if (!(await comparePassword(password, user.password_hash))) throw new HttpError(401, 'Credenciales incorrectas');

  const token = signToken({ userId: user.id, role: user.role, dependency_id: user.dependency_id });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      dependency_id: user.dependency_id,
    },
  };
};

export const getProfile = async (userId: number) => {
  const user = orNotFound(
    await prisma.user.findUnique({ where: { id: userId }, include: { dependency: { select: { name: true } } } }),
    'Usuario no encontrado',
  );
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    dependency_id: user.dependency_id,
    dependency_name: user.dependency?.name ?? null,
    is_active: user.is_active,
  };
};
