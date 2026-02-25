const { Router } = require('express');
const { body, param, query } = require('express-validator');
const {
  listParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipantCertificates,
} = require('../controllers/participantController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// 9.09 - Todas las rutas requieren autenticacion
// Ambos roles (admin y emisor) pueden gestionar participantes
router.use(authMiddleware);

// GET / - listar participantes con paginacion y busqueda
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
    query('search').optional().isString().trim(),
  ],
  validateRequest,
  listParticipants
);

// GET /:id - detalle de un participante
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getParticipant
);

// POST / - crear participante
router.post(
  '/',
  [
    body('full_name').notEmpty().withMessage('El nombre completo es requerido'),
    body('email').optional().isEmail().withMessage('Email invalido'),
  ],
  validateRequest,
  createParticipant
);

// PUT /:id - actualizar participante
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('full_name').optional().notEmpty().withMessage('El nombre no puede estar vacio'),
    body('email').optional().isEmail().withMessage('Email invalido'),
  ],
  validateRequest,
  updateParticipant
);

// DELETE /:id - eliminar participante
router.delete(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deleteParticipant
);

// GET /:id/certificates - historial de certificados del participante
router.get(
  '/:id/certificates',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getParticipantCertificates
);

module.exports = router;
