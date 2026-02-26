const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, param } = require('express-validator');
const {
  listTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  uploadTagLogo,
} = require('../controllers/tagController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// Multer para logos de tags
const logoStorage = multer.diskStorage({
  destination: '/app/storage/logos/tags/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage: logoStorage,
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

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// GET / - listar (todos los autenticados)
router.get('/', listTags);

// GET /:id - detalle (todos los autenticados)
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getTag
);

// POST / - crear (solo admin)
router.post(
  '/',
  roleMiddleware('admin'),
  [
    body('name').notEmpty().withMessage('Nombre es requerido'),
    body('slug')
      .notEmpty().withMessage('Slug es requerido')
      .matches(/^[a-z0-9-]+$/).withMessage('Slug debe ser alfanumerico en minusculas con guiones'),
  ],
  validateRequest,
  createTag
);

// PUT /:id - actualizar (solo admin)
router.put(
  '/:id',
  roleMiddleware('admin'),
  [
    param('id').isInt().withMessage('ID invalido'),
    body('name').optional().notEmpty().withMessage('Nombre no puede estar vacio'),
    body('slug').optional().matches(/^[a-z0-9-]+$/).withMessage('Slug debe ser alfanumerico en minusculas con guiones'),
  ],
  validateRequest,
  updateTag
);

// DELETE /:id - eliminar (solo admin)
router.delete(
  '/:id',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deleteTag
);

// POST /:id/logo - subir logo (solo admin)
router.post(
  '/:id/logo',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  upload.single('logo'),
  uploadTagLogo
);

module.exports = router;
