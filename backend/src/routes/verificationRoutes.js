const { Router } = require('express');
const { param } = require('express-validator');
const { verifyCertificate } = require('../controllers/verificationController');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// 16.02 - Ruta publica (sin authMiddleware)
// GET /:uuid - verificar autenticidad de un certificado
router.get(
  '/:uuid',
  [param('uuid').isUUID().withMessage('UUID invalido')],
  validateRequest,
  verifyCertificate
);

module.exports = router;
