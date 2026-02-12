const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,

  // Base de datos
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'database',
  POSTGRES_PORT: process.env.POSTGRES_PORT || 5432,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '8h',

  // URLs
  BASE_URL: process.env.BASE_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || 'http://localhost:3000',
  VERIFICATION_BASE_URL: process.env.VERIFICATION_BASE_URL || 'http://localhost:5173/verificar',
};
