// Los tests usan una BD aparte (<POSTGRES_DB>_test) en el mismo servidor de Postgres.
export const testDatabaseUrl = () => {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (!url.pathname.endsWith('_test')) url.pathname = `${url.pathname}_test`;
  return url.toString();
};
