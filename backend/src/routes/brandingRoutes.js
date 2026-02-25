const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, param } = require('express-validator');
const {
  getActive,
  listVersions,
  createVersion,
  activateVersion,
  uploadLogo,
  updateVersion,
  deleteVersion,
} = require('../controllers/brandingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// 11.12 - Multer para logos institucionales en storage/logos/branding/
const storage = multer.diskStorage({
  destination: '/app/storage/logos/branding/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// 11.10 - GET /active es publico (sin authMiddleware)
router.get('/active', getActive);

// El resto requiere autenticacion y rol admin
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// GET /versions - listar todas las versiones
router.get('/versions', listVersions);

// POST /versions - crear nueva version
router.post(
  '/versions',
  [
    body('version_label').notEmpty().withMessage('version_label es requerido'),
    body('primary_color')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('primary_color debe ser un color hexadecimal valido (#RRGGBB)'),
    body('secondary_color')
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('secondary_color debe ser un color hexadecimal valido (#RRGGBB)'),
    body('font_family').notEmpty().withMessage('font_family es requerido'),
    body('organization_name').notEmpty().withMessage('organization_name es requerido'),
  ],
  validateRequest,
  createVersion
);

// PUT /versions/:id/activate - activar una version
router.put(
  '/versions/:id/activate',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  activateVersion
);

// PUT /versions/:id - editar una version
router.put(
  '/versions/:id',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('version_label').optional().notEmpty().withMessage('version_label no puede estar vacio'),
    body('primary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color hexadecimal invalido'),
    body('secondary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color hexadecimal invalido'),
    body('font_family').optional().notEmpty(),
    body('organization_name').optional().notEmpty(),
  ],
  validateRequest,
  updateVersion
);

// DELETE /versions/:id - eliminar una version
router.delete(
  '/versions/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deleteVersion
);

// POST /versions/:id/logo - subir logo institucional
router.post(
  '/versions/:id/logo',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  upload.single('logo'),
  uploadLogo
);

module.exports = router;
