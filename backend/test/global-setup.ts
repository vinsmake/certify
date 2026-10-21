import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './test-env';

// Una vez por corrida: crea/actualiza el schema de la BD de pruebas.
export default function setup() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'inherit',
  });
}
