const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ensureDirectoryExists } = require('../utils/fileUtils');
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
  uploadSignature,
  deleteSignature,
} = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');
const dependencyMiddleware = require('../middlewares/dependencyMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

// Multer para firmas de instructor en storage/signatures/
const SIGNATURES_DIR = '/app/storage/signatures/';
ensureDirectoryExists(SIGNATURES_DIR);

const signatureStorage = multer.diskStorage({
  destination: SIGNATURES_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const signatureUpload = multer({
  storage: signatureStorage,
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
    body('type').isIn(['curso', 'charla', 'taller', 'seminario']).withMessage('Tipo debe ser curso, charla, taller o seminario'),
    body('duration_hours').optional().isInt({ min: 1 }).withMessage('Duracion debe ser un numero entero positivo'),
    body('start_date').optional().isISO8601().withMessage('Fecha de inicio invalida'),
    body('end_date').optional().isISO8601().withMessage('Fecha de fin invalida'),
    body('dependency_id').optional({ nullable: true }).isInt().withMessage('dependency_id invalido'),
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
    body('type').optional().isIn(['curso', 'charla', 'taller', 'seminario']).withMessage('Tipo debe ser curso, charla, taller o seminario'),
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
      .isIn(['enrolled', 'completed'])
      .withMessage('attendance_status debe ser: enrolled o completed'),
  ],
  validateRequest,
  updateParticipantStatus
);

// -------------------------------------------------------
// Rutas de firma del instructor
// -------------------------------------------------------

// POST /:id/signature - subir firma del instructor
router.post(
  '/:id/signature',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  signatureUpload.single('signature'),
  uploadSignature
);

// DELETE /:id/signature - eliminar firma del instructor
router.delete(
  '/:id/signature',
  [param('id').isInt().withMessage('ID invalido')],
  validateRequest,
  deleteSignature
);

module.exports = router;
