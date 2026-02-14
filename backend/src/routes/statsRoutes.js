const { Router } = require('express');
const { param } = require('express-validator');
const { getGlobalStats, getDependencyStats, getMyStats } = require('../controllers/statsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

router.use(authMiddleware);

// GET / - estadisticas globales (solo admin)
router.get('/', roleMiddleware('admin'), getGlobalStats);

// GET /me - estadisticas de la dependencia del usuario actual (admin y emisor)
router.get('/me', getMyStats);

// GET /dependency/:id - estadisticas de una dependencia especifica (solo admin)
router.get(
  '/dependency/:id',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getDependencyStats
);

module.exports = router;
