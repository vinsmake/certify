const { Router } = require('express');
const { body, param, query } = require('express-validator');
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseDependency,
  removeCourseDependency,
  listCourseParticipants,
  enrollParticipants,
  updateParticipantStatus,
} = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');
const dependencyMiddleware = require('../middlewares/dependencyMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// GET / - listar cursos (filtrado por dependencia)
router.get('/', dependencyMiddleware, listCourses);

// GET /:id - detalle con dependencias asociadas
router.get(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  getCourse
);

// POST / - crear curso
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nombre es requerido'),
    body('type').isIn(['curso', 'charla', 'taller']).withMessage('Tipo debe ser curso, charla o taller'),
    body('duration_hours').optional().isInt({ min: 1 }).withMessage('Duracion debe ser un numero entero positivo'),
    body('start_date').optional().isISO8601().withMessage('Fecha de inicio invalida'),
    body('end_date').optional().isISO8601().withMessage('Fecha de fin invalida'),
    body('dependency_id').optional().isInt().withMessage('dependency_id invalido'),
  ],
  validateRequest,
  createCourse
);

// PUT /:id - actualizar curso
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('name').optional().notEmpty().withMessage('Nombre no puede estar vacio'),
    body('type').optional().isIn(['curso', 'charla', 'taller']).withMessage('Tipo debe ser curso, charla o taller'),
    body('duration_hours').optional().isInt({ min: 1 }).withMessage('Duracion debe ser un numero entero positivo'),
    body('start_date').optional().isISO8601().withMessage('Fecha de inicio invalida'),
    body('end_date').optional().isISO8601().withMessage('Fecha de fin invalida'),
  ],
  validateRequest,
  updateCourse
);

// DELETE /:id - eliminar curso
router.delete(
  '/:id',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deleteCourse
);

// POST /:id/dependencies - agregar dependencia colaboradora
router.post(
  '/:id/dependencies',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('dependency_id').isInt().withMessage('dependency_id es requerido'),
    body('display_order').optional().isInt({ min: 1 }).withMessage('display_order debe ser un entero positivo'),
  ],
  validateRequest,
  addCourseDependency
);

// DELETE /:id/dependencies/:depId - quitar dependencia colaboradora
router.delete(
  '/:id/dependencies/:depId',
  [
    param('id').isInt().withMessage('ID de curso invalido'),
    param('depId').isInt().withMessage('ID de dependencia invalido'),
  ],
  validateRequest,
  removeCourseDependency
);

// -------------------------------------------------------
// Rutas de inscripcion de participantes a cursos (10.05)
// -------------------------------------------------------

// GET /:id/participants - listar participantes inscritos
router.get(
  '/:id/participants',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  listCourseParticipants
);

// POST /:id/participants - inscribir participantes
// 10.06 - Validaciones: participant_ids requerido y es array no vacio
router.post(
  '/:id/participants',
  [
    param('id').isInt().withMessage('ID invalido'),
    body('participant_ids')
      .isArray({ min: 1 })
      .withMessage('participant_ids debe ser un array con al menos un elemento'),
    body('participant_ids.*')
      .isInt({ min: 1 })
      .withMessage('Cada participant_id debe ser un entero positivo'),
  ],
  validateRequest,
  enrollParticipants
);

// PUT /:id/participants/:participantId - cambiar estado de asistencia
// 10.06 - Validacion: attendance_status debe ser valor valido
router.put(
  '/:id/participants/:participantId',
  [
    param('id').isInt().withMessage('ID de curso invalido'),
    param('participantId').isInt().withMessage('ID de participante invalido'),
    body('attendance_status')
      .isIn(['enrolled', 'attended', 'completed', 'absent'])
      .withMessage('attendance_status debe ser: enrolled, attended, completed o absent'),
  ],
  validateRequest,
  updateParticipantStatus
);

module.exports = router;
