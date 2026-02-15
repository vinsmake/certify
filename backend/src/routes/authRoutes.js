const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// 31.01 - Rate limiting en login: maximo 10 intentos por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.get('/me', authMiddleware, getMe);

module.exports = router;
