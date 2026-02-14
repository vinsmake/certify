const { Router } = require('express');
const { listAdminEvents, listAdminCertificates, listAdminActivity } = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = Router();

// Todas las rutas admin requieren autenticacion y rol admin
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// GET /events - lista global de todos los cursos/eventos con filtros
router.get('/events', listAdminEvents);

// GET /certificates - lista global de todos los certificados con filtros
router.get('/certificates', listAdminCertificates);

// GET /activity - registro de actividad reciente del sistema
router.get('/activity', listAdminActivity);

module.exports = router;
