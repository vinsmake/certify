import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { loginSchema } from '@certify/shared';
import { authenticate, currentUser } from '../../middlewares/auth';
import { parseBody } from '../../middlewares/validate';
import * as auth from './auth.service';

export const authRoutes = Router();

// Maximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

authRoutes.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parseBody(loginSchema, req);
  res.json(await auth.login(email, password));
});

authRoutes.get('/me', authenticate, async (req, res) => {
  res.json(await auth.getProfile(currentUser(req).userId));
});
