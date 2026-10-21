import request from 'supertest';
import { createApp } from '../src/app';
import { hashPassword } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { ensureStorageDirs } from '../src/lib/storage';

export const app = createApp();
export const api = () => request(app);

export const ADMIN = { email: 'admin@test.local', password: 'password-de-prueba' };

/** Vacia todas las tablas y crea admin, branding y una plantilla minima. */
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
  await prisma.brandingVersion.create({
    data: {
      version_label: 'v1',
      logo_path: '/storage/logos/branding/none.png',
      primary_color: '#000000',
      secondary_color: '#ffffff',
      font_family: 'Roboto',
      organization_name: 'Org de prueba',
      is_active: true,
    },
  });
  await prisma.certificateTemplate.create({
    data: {
      name: 'Prueba',
      slug: 'prueba',
      is_default: true,
      html_content: '<html><body><h1>{{participant_name}}</h1><p>{{course_name}}</p><img src="{{qr_code_base64}}"></body></html>',
    },
  });
  return admin;
};

export const loginAsAdmin = async () => {
  const res = await api().post('/api/auth/login').send(ADMIN).expect(200);
  return res.body.token as string;
};
