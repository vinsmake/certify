import request from 'supertest';
import { createApp } from '../src/app';
import { hashPassword } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { ensureStorageDirs } from '../src/lib/storage';

export const app = createApp();
export const api = () => request(app);

export const ADMIN = { email: 'admin@test.local', password: 'password-de-prueba' };

/** Vacia todas las tablas y crea el admin y una plantilla base minima. */
export const resetDatabase = async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
  ensureStorageDirs();

  const admin = await prisma.user.create({
    data: { email: ADMIN.email, password_hash: await hashPassword(ADMIN.password), full_name: 'Admin', role: 'admin' },
  });
  await prisma.certificateTemplate.create({
    data: {
      name: 'Prueba',
      slug: 'prueba',
      is_default: true,
      html_content:
        '<html><body><h1>{{participant_name}}</h1><p>{{course_name}}</p><p>{{organization_name}}</p><img src="{{qr_code_base64}}"></body></html>',
    },
  });
  return admin;
};

export const loginAsAdmin = async () => {
  const res = await api().post('/api/auth/login').send(ADMIN).expect(200);
  return res.body.token as string;
};
