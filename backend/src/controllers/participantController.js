const Participant = require('../models/Participant');
const pool = require('../config/database');

// 9.02 - GET / - listar con paginacion y busqueda
const listParticipants = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const result = await Participant.findAll({ page, limit, search });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// 9.03 - GET /:id - obtener participante por ID
const getParticipant = async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }
    res.json(participant);
  } catch (err) {
    next(err);
  }
};

// 9.04 - POST / - crear participante
const createParticipant = async (req, res, next) => {
  try {
    const { document_id, full_name, email, organization, position } = req.body;

    const existing = await Participant.findByDocumentId(document_id);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un participante con ese documento' });
    }

    const participant = await Participant.create({ document_id, full_name, email, organization, position });
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

    const { document_id, full_name, email, organization, position } = req.body;

    // Si se cambia el document_id, verificar que no exista ya en otro registro
    if (document_id && document_id !== participant.document_id) {
      const existing = await Participant.findByDocumentId(document_id);
      if (existing) {
        return res.status(409).json({ error: 'Ya existe un participante con ese documento' });
      }
    }

    const updated = await Participant.update(req.params.id, {
      document_id, full_name, email, organization, position,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// 9.06 - DELETE /:id - eliminar participante
const deleteParticipant = async (req, res, next) => {
  try {
    const deleted = await Participant.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Participante no encontrado' });
    }
    res.json({ message: 'Participante eliminado', id: deleted.id });
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
