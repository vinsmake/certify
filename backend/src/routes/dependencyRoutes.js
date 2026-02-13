const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { body, param } = require('express-validator');
const {
  listDependencies,
  getDependency,
  createDependency,
  updateDependency,
  deactivateDependency,
  uploadLogo,
} = require('../controllers/dependencyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// Multer para logos de dependencias
const storage = multer.diskStorage({
  destination: '/app/storage/logos/dependencies/',
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

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// GET / - listar (todos los autenticados)
router.get('/', listDependencies);

// GET /:id - detalle (todos los autenticados)
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getDependency
);

// POST / - crear (solo admin)
router.post(
  '/',
  roleMiddleware('admin'),
  [body('name').notEmpty().withMessage('Nombre es requerido')],
  validateRequest,
  createDependency
);

// PUT /:id - actualizar (solo admin)
router.put(
  '/:id',
  roleMiddleware('admin'),
  [
    param('id').isInt().withMessage('ID invalido'),
    body('name').optional().notEmpty().withMessage('Nombre no puede estar vacio'),
  ],
  validateRequest,
  updateDependency
);

// DELETE /:id - desactivar (solo admin)
router.delete(
  '/:id',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deactivateDependency
);

// POST /:id/logo - subir logo (solo admin)
router.post(
  '/:id/logo',
  roleMiddleware('admin'),
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  upload.single('logo'),
  uploadLogo
);

module.exports = router;
