import type { CreateUserInput, UpdateUserInput } from '@certify/shared';
import { hashPassword } from '../../lib/auth';
import { conflict, orNotFound } from '../../lib/http-error';
import { prisma, type User } from '../../lib/prisma';

const publicUser = (u: User) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  role: u.role,
  dependency_id: u.dependency_id,
  is_active: u.is_active,
});

export const list = async (dependencyId: number | null) => {
  const users = await prisma.user.findMany({
    where: dependencyId ? { dependency_id: dependencyId } : {},
    include: { dependency: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  });
  return users.map(({ password_hash: _hash, dependency, ...u }) => ({ ...u, dependency_name: dependency?.name ?? null }));
};

export const create = async (input: CreateUserInput) => {
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw conflict('El email ya esta registrado');
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password_hash: await hashPassword(input.password),
      full_name: input.full_name,
      role: input.role,
      dependency_id: input.dependency_id ?? null,
    },
  });
  return publicUser(user);
};

export const update = async (id: number, input: UpdateUserInput) => {
  orNotFound(await prisma.user.findUnique({ where: { id } }), 'Usuario no encontrado');
  if (input.email) {
    const other = await prisma.user.findUnique({ where: { email: input.email } });
    if (other && other.id !== id) throw conflict('El email ya esta registrado por otro usuario');
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      is_active: input.is_active,
      // Un admin no tiene dependencia; dependencia la conserva salvo que se envie
      dependency_id: input.role === 'admin' ? null : input.dependency_id,
    },
  });
  return publicUser(user);
};

export const deactivate = async (id: number) => {
  orNotFound(await prisma.user.findUnique({ where: { id } }), 'Usuario no encontrado');
  const user = await prisma.user.update({ where: { id }, data: { is_active: false } });
  return { message: 'Usuario desactivado', id: user.id };
};
