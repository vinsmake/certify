const { Router } = require('express');
const { body, param } = require('express-validator');
const { listUsers, createUser, updateUser, deactivateUser } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const dependencyMiddleware = require('../middlewares/dependencyMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// Todas las rutas requieren auth + admin
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// GET / - listar usuarios (admin ve todos, pero se aplica dependencyMiddleware por consistencia)
router.get('/', dependencyMiddleware, listUsers);

// POST / - crear usuario
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Email invalido'),
    body('password').isLength({ min: 8 }).withMessage('Password debe tener minimo 8 caracteres'),
    body('full_name').notEmpty().withMessage('Nombre completo es requerido'),
    body('role').isIn(['admin', 'emisor']).withMessage('Rol debe ser admin o emisor'),
    body('dependency_id').custom((value, { req }) => {
      if (req.body.role === 'emisor' && !value) {
        throw new Error('dependency_id es requerido para el rol emisor');
      }
      return true;
    }),
  ],
  validateRequest,
  createUser
);

// PUT /:id - actualizar usuario
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('email').optional().isEmail().withMessage('Email invalido'),
    body('full_name').optional().notEmpty().withMessage('Nombre completo no puede estar vacio'),
    body('role').optional().isIn(['admin', 'emisor']).withMessage('Rol debe ser admin o emisor'),
    body('dependency_id').optional(),
  ],
  validateRequest,
  updateUser
);

// DELETE /:id - desactivar usuario
router.delete(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deactivateUser
);

module.exports = router;
