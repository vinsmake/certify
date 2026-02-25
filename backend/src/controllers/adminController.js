const pool = require('../config/database');

// 17.04 - GET /api/admin/events - lista global de cursos con filtros (solo admin)
const listAdminEvents = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.query.dependency_id) {
      conditions.push(`co.dependency_id = $${idx++}`);
      params.push(parseInt(req.query.dependency_id));
    }
    if (req.query.type) {
      conditions.push(`co.type = $${idx++}`);
      params.push(req.query.type);
    }
    if (req.query.date_from) {
      conditions.push(`co.start_date >= $${idx++}`);
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      conditions.push(`co.end_date <= $${idx++}`);
      params.push(req.query.date_to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT co.id, co.name, co.type, co.duration_hours, co.instructor,
             co.start_date, co.end_date, co.created_at,
             d.name AS dependency_name, d.abbreviation AS dependency_abbreviation,
             u.full_name AS created_by_name,
             COUNT(DISTINCT cp.participant_id) AS participant_count,
             COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid') AS certificates_issued
      FROM courses co
      LEFT JOIN dependencies d ON co.dependency_id = d.id
      LEFT JOIN users u ON co.created_by = u.id
      LEFT JOIN course_participants cp ON cp.course_id = co.id
      LEFT JOIN certificates cert ON cert.course_id = co.id
      ${where}
      GROUP BY co.id, co.name, co.type, co.duration_hours, co.instructor,
               co.start_date, co.end_date, co.created_at,
               d.name, d.abbreviation, u.full_name
      ORDER BY co.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}`;

    const countQuery = `SELECT COUNT(*) FROM courses co ${where}`;

    params.push(limit, offset);
    const countParams = params.slice(0, conditions.length);

    const [{ rows }, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      data: rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// 17.05 - GET /api/admin/certificates - lista global de certificados con filtros (solo admin)
const listAdminCertificates = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (req.query.dependency_id) {
      conditions.push(`co.dependency_id = $${idx++}`);
      params.push(parseInt(req.query.dependency_id));
    }
    if (req.query.status) {
      conditions.push(`c.status = $${idx++}`);
      params.push(req.query.status);
    }
    if (req.query.course_id) {
      conditions.push(`c.course_id = $${idx++}`);
      params.push(parseInt(req.query.course_id));
    }
    if (req.query.date_from) {
      conditions.push(`c.issue_date >= $${idx++}`);
      params.push(req.query.date_from);
    }
    if (req.query.date_to) {
      conditions.push(`c.issue_date <= $${idx++}`);
      params.push(req.query.date_to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT c.id, c.uuid, c.issue_date, c.status, c.revocation_reason, c.revoked_at, c.created_at,
             p.full_name AS participant_name,
             co.name AS course_name, co.type AS course_type,
             d.name AS dependency_name,
             ct.name AS template_name,
             u.full_name AS issued_by_name
      FROM certificates c
      LEFT JOIN participants p ON c.participant_id = p.id
      LEFT JOIN courses co ON c.course_id = co.id
      LEFT JOIN dependencies d ON co.dependency_id = d.id
      LEFT JOIN certificate_templates ct ON c.template_id = ct.id
      LEFT JOIN users u ON c.issued_by = u.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}`;

    const countQuery = `
      SELECT COUNT(*)
      FROM certificates c
      LEFT JOIN courses co ON c.course_id = co.id
      ${where}`;

    params.push(limit, offset);
    const countParams = params.slice(0, conditions.length);

    const [{ rows }, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams),
    ]);

    res.json({
      data: rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

// 17.06 - GET /api/admin/activity - registro de actividad reciente (solo admin)
const listAdminActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const { rows } = await pool.query(`
      SELECT * FROM (
        -- Emisiones de certificados
        SELECT
          'certificate_emission'    AS type,
          c.created_at              AS event_at,
          u.full_name               AS user_name,
          p.full_name               AS subject,
          co.name                   AS course_name,
          d.name                    AS dependency_name,
          c.uuid::text              AS reference
        FROM certificates c
        LEFT JOIN users u       ON c.issued_by = u.id
        LEFT JOIN participants p ON c.participant_id = p.id
        LEFT JOIN courses co    ON c.course_id = co.id
        LEFT JOIN dependencies d ON co.dependency_id = d.id

        UNION ALL

        -- Revocaciones
        SELECT
          'revocation'              AS type,
          rl.revoked_at             AS event_at,
          u.full_name               AS user_name,
          p.full_name               AS subject,
          co.name                   AS course_name,
          d.name                    AS dependency_name,
          c.uuid::text              AS reference
        FROM revocation_log rl
        JOIN certificates c      ON rl.certificate_id = c.id
        LEFT JOIN users u        ON rl.revoked_by = u.id
        LEFT JOIN participants p ON c.participant_id = p.id
        LEFT JOIN courses co     ON c.course_id = co.id
        LEFT JOIN dependencies d ON co.dependency_id = d.id

        UNION ALL

        -- Creacion de cursos
        SELECT
          'course_creation'         AS type,
          co.created_at             AS event_at,
          u.full_name               AS user_name,
          co.name                   AS subject,
          co.name                   AS course_name,
          d.name                    AS dependency_name,
          co.id::text               AS reference
        FROM courses co
        LEFT JOIN users u        ON co.created_by = u.id
        LEFT JOIN dependencies d ON co.dependency_id = d.id

        UNION ALL

        -- Cambios de branding (creacion de nuevas versiones)
        SELECT
          'branding_change'         AS type,
          bv.created_at             AS event_at,
          u.full_name               AS user_name,
          bv.version_label          AS subject,
          NULL                      AS course_name,
          NULL                      AS dependency_name,
          bv.version_label          AS reference
        FROM branding_versions bv
        LEFT JOIN users u ON bv.created_by = u.id
      ) activity
      ORDER BY event_at DESC
      LIMIT $1
    `, [limit]);

    res.json({ data: rows, limit });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAdminEvents, listAdminCertificates, listAdminActivity };
