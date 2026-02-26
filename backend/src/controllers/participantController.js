const Participant = require('../models/Participant');
const pool = require('../config/database');

// 9.02 - GET / - listar con paginacion y busqueda
const listParticipants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const result = await Participant.findAll({
      page,
      limit,
      search,
      dependency_id: req.dependencyFilter,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Verifica que un usuario 'dependencia' pueda acceder a este participante
const checkParticipantAccess = (participant, user) => {
  if (user.role === 'admin') return true;
  return participant.dependency_id === user.dependency_id;
};

// 9.03 - GET /:id - obtener participante por ID
const getParticipant = async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }
    if (!checkParticipantAccess(participant, req.user)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    res.json(participant);
  } catch (err) {
    next(err);
  }
};

// 9.04 - POST / - crear participante
const createParticipant = async (req, res, next) => {
  try {
    const { full_name, email } = req.body;

    // Dependencia: el rol 'dependencia' usa la suya; admin especifica en el body
    const dependency_id = req.user.role === 'dependencia'
      ? req.user.dependency_id
      : (req.body.dependency_id || null);

    const participant = await Participant.create({ full_name, email, dependency_id });
    res.status(201).json(participant);
  } catch (err) {
    next(err);
  }
};

// 9.05 - PUT /:id - actualizar participante
const updateParticipant = async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }
    if (!checkParticipantAccess(participant, req.user)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const { full_name, email } = req.body;
    const dependency_id = req.user.role === 'dependencia'
      ? req.user.dependency_id
      : (req.body.dependency_id !== undefined ? req.body.dependency_id : participant.dependency_id);

    const updated = await Participant.update(req.params.id, { full_name, email, dependency_id });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 9.06 - DELETE /:id - eliminar participante
const deleteParticipant = async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }
    if (!checkParticipantAccess(participant, req.user)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    await Participant.delete(req.params.id);
    res.json({ message: 'Participante eliminado', id: participant.id });
  } catch (err) {
    next(err);
  }
};

// 9.07 - GET /:id/certificates - historial de certificados del participante
const getParticipantCertificates = async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }

    const { rows } = await pool.query(
      `SELECT c.id, c.uuid, c.issue_date, c.status, c.revocation_reason, c.revoked_at,
              co.name AS course_name, co.type AS course_type, co.duration_hours,
              ct.name AS template_name
       FROM certificates c
       LEFT JOIN courses co ON c.course_id = co.id
       LEFT JOIN certificate_templates ct ON c.template_id = ct.id
       WHERE c.participant_id = $1
       ORDER BY c.issue_date DESC`,
      [req.params.id]
    );

    res.json({ participant, certificates: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getParticipantCertificates,
};
