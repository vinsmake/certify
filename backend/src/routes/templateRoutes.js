const { Router } = require('express');
const { body, param } = require('express-validator');
const {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  previewTemplate,
  setDefault,
  sampleQr,
} = require('../controllers/templateController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// GET / - listar plantillas activas
router.get('/', listTemplates);

// GET /sample-qr - QR de ejemplo para preview en tiempo real
router.get('/sample-qr', sampleQr);

// GET /:id - detalle con html_content
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getTemplate
);

// POST / - crear plantilla (solo admin)
router.post(
  '/',
  roleMiddleware('admin'),
  [
    body('name').notEmpty().withMessage('Nombre es requerido'),
    body('slug').notEmpty().withMessage('Slug es requerido'),
    body('html_content').notEmpty().withMessage('Contenido HTML es requerido'),
    body('orientation').optional().isIn(['landscape', 'portrait']).withMessage('Orientacion debe ser landscape o portrait'),
    body('page_size').optional().isIn(['letter', 'A4']).withMessage('Tamano debe ser letter o A4'),
  ],
  validateRequest,
  createTemplate
);

// PUT /:id - actualizar (solo admin)
router.put(
  '/:id',
  roleMiddleware('admin'),
  [
    param('id').isInt().withMessage('ID invalido'),
    body('name').optional().notEmpty().withMessage('Nombre no puede estar vacio'),
    body('slug').optional().notEmpty().withMessage('Slug no puede estar vacio'),
    body('orientation').optional().isIn(['landscape', 'portrait']).withMessage('Orientacion debe ser landscape o portrait'),
    body('page_size').optional().isIn(['letter', 'A4']).withMessage('Tamano debe ser letter o A4'),
  ],
  validateRequest,
  updateTemplate
);

// DELETE /:id - desactivar (solo admin)
router.delete(
  '/:id',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deactivateTemplate
);

// POST /:id/preview - generar PDF preview (usuarios autenticados)
router.post(
  '/:id/preview',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  previewTemplate
);

// PUT /:id/default - establecer como default (solo admin)
router.put(
  '/:id/default',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  setDefault
);

module.exports = router;
