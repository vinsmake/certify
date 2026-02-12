const { Pool } = require('pg');
const environment = require('./environment');

const pool = new Pool({
  user: environment.POSTGRES_USER,
  password: environment.POSTGRES_PASSWORD,
  host: environment.POSTGRES_HOST,
  port: environment.POSTGRES_PORT,
  database: environment.POSTGRES_DB,
});

pool.on('connect', () => {
  console.log('Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error en la conexion a PostgreSQL:', err.message);
});

module.exports = pool;
