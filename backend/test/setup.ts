import { testDatabaseUrl } from './test-env';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_SECRET ??= 'test-secret-de-al-menos-treinta-y-dos-caracteres';
process.env.STORAGE_ROOT = '/tmp/certify-test-storage';
