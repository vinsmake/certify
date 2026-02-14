const { Router } = require('express');
const { body, param, query } = require('express-validator');
const {
  listCertificates,
  getCertificate,
  emitCertificates,
  downloadCertificate,
  revokeCertificateHandler,
} = require('../controllers/certificateController');
const authMiddleware = require('../middlewares/authMiddleware');
const dependencyMiddleware = require('../middlewares/dependencyMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// 14.12 - Todas las rutas requieren autenticacion
router.use(authMiddleware);

// GET / - listar certificados (filtrado por dependencia via dependencyMiddleware)
router.get('/', dependencyMiddleware, listCertificates);

// GET /:id - detalle de un certificado
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getCertificate
);

// POST /emit - emitir certificados (admin y emisor)
// 14.08 validacion de attendance_status y 14.09 de duplicados se hace en el service
router.post(
  '/emit',
  [
    body('course_id')
      .isInt({ min: 1 })
      .withMessage('course_id es requerido y debe ser un entero positivo'),
    body('participant_ids')
      .isArray({ min: 1 })
      .withMessage('participant_ids debe ser un array con al menos un elemento'),
    body('participant_ids.*')
      .isInt({ min: 1 })
      .withMessage('Cada participant_id debe ser un entero positivo'),
    body('template_id')
      .isInt({ min: 1 })
      .withMessage('template_id es requerido y debe ser un entero positivo'),
  ],
  validateRequest,
  emitCertificates
);

// GET /:id/download - descargar PDF
router.get(
  '/:id/download',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  downloadCertificate
);

// POST /:id/revoke - revocar un certificado
// 15.06 - reason es requerido
router.post(
  '/:id/revoke',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('reason').notEmpty().withMessage('La razon de revocacion es requerida'),
  ],
  validateRequest,
  revokeCertificateHandler
);

module.exports = router;
