// Datos iniciales. Es idempotente: solo crea lo que falta, nunca sobrescribe cambios hechos
// desde la app. Se ejecuta en cada arranque de desarrollo (npm run dev) y con `npm run db:seed`.
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import type { Orientation, PageSize } from '../src/generated/prisma/client';

const TEMPLATES_DIR = path.join(import.meta.dirname, 'seed-data', 'templates');

interface TemplateSeed {
  slug: string;
  name: string;
  description: string | null;
  orientation: Orientation;
  page_size: PageSize;
  is_default: boolean;
  is_active: boolean;
}

const seedAdmin = async () => {
  if (await prisma.user.count()) return null;
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('BD sin usuarios: define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env para crear el admin inicial');
  }
  const admin = await prisma.user.create({
    data: {
      email,
      password_hash: await bcrypt.hash(password, 12),
      full_name: 'Administrador',
      role: 'admin',
    },
  });
  console.log(`[seed] admin creado: ${email}`);
  return admin;
};

const seedDependency = async () => {
  if (await prisma.dependency.count()) return;
  await prisma.dependency.create({ data: { name: 'Dependencia General', abbreviation: 'DG' } });
  console.log('[seed] dependencia por defecto creada');
};

const seedTemplates = async (createdBy: number | undefined) => {
  const seeds: TemplateSeed[] = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, 'templates.json'), 'utf8'));
  const hasDefault = (await prisma.certificateTemplate.count({ where: { is_default: true } })) > 0;
  for (const t of seeds) {
    if (await prisma.certificateTemplate.findUnique({ where: { slug: t.slug } })) continue;
    await prisma.certificateTemplate.create({
      data: {
        ...t,
        is_default: t.is_default && !hasDefault,
        html_content: fs.readFileSync(path.join(TEMPLATES_DIR, `${t.slug}.html`), 'utf8'),
        created_by: createdBy,
      },
    });
    console.log(`[seed] plantilla creada: ${t.slug}`);
  }
};

const main = async () => {
  const admin = (await seedAdmin()) ?? (await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { id: 'asc' } }));
  await seedDependency();
  await seedTemplates(admin?.id);
};

main()
  .catch((err) => {
    console.error('[seed] error:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
