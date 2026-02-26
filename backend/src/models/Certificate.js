const pool = require('../config/database');

const Certificate = {
  async findAll({ page = 1, limit = 20, course_id, participant_id, status, dependency_id }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (dependency_id) {
      conditions.push(`co.dependency_id = $${idx++}`);
      params.push(dependency_id);
    }
    if (course_id) {
      conditions.push(`c.course_id = $${idx++}`);
      params.push(course_id);
    }
    if (participant_id) {
      conditions.push(`c.participant_id = $${idx++}`);
      params.push(participant_id);
    }
    if (status) {
      conditions.push(`c.status = $${idx++}`);
      params.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT c.id, c.uuid, c.issue_date, c.status, c.pdf_path,
             c.revocation_reason, c.revoked_at, c.created_at,
             c.participant_id,
             p.full_name AS participant_name,
             co.name AS course_name, co.type AS course_type,
             co.dependency_id,
             d.name AS dependency_name,
             ct.name AS template_name,
             bv.version_label AS branding_label,
             u.full_name AS issued_by_name
      FROM certificates c
      LEFT JOIN participants p ON c.participant_id = p.id
      LEFT JOIN courses co ON c.course_id = co.id
      LEFT JOIN dependencies d ON co.dependency_id = d.id
      LEFT JOIN certificate_templates ct ON c.template_id = ct.id
      LEFT JOIN branding_versions bv ON c.branding_version_id = bv.id
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

    return {
      data: rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT c.*,
              p.full_name AS participant_name, p.email AS participant_email,
              co.name AS course_name, co.type AS course_type, co.duration_hours,
              co.instructor, co.start_date, co.end_date, co.dependency_id,
              d.name AS dependency_name,
              ct.name AS template_name, ct.orientation, ct.page_size,
              bv.version_label AS branding_label, bv.primary_color, bv.secondary_color,
              bv.font_family, bv.organization_name, bv.logo_path AS branding_logo_path,
              u.full_name AS issued_by_name
       FROM certificates c
       LEFT JOIN participants p ON c.participant_id = p.id
       LEFT JOIN courses co ON c.course_id = co.id
       LEFT JOIN dependencies d ON co.dependency_id = d.id
       LEFT JOIN certificate_templates ct ON c.template_id = ct.id
       LEFT JOIN branding_versions bv ON c.branding_version_id = bv.id
       LEFT JOIN users u ON c.issued_by = u.id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUuid(uuid) {
    const { rows } = await pool.query(
      `SELECT c.*,
              p.full_name AS participant_name, p.email AS participant_email,
              co.name AS course_name, co.type AS course_type, co.duration_hours,
              co.instructor, co.start_date, co.end_date, co.dependency_id,
              d.name AS dependency_name,
              ct.name AS template_name,
              bv.version_label AS branding_label, bv.primary_color, bv.secondary_color,
              bv.font_family, bv.organization_name, bv.logo_path AS branding_logo_path,
              u.full_name AS issued_by_name
       FROM certificates c
       LEFT JOIN participants p ON c.participant_id = p.id
       LEFT JOIN courses co ON c.course_id = co.id
       LEFT JOIN dependencies d ON co.dependency_id = d.id
       LEFT JOIN certificate_templates ct ON c.template_id = ct.id
       LEFT JOIN branding_versions bv ON c.branding_version_id = bv.id
       LEFT JOIN users u ON c.issued_by = u.id
       WHERE c.uuid = $1`,
      [uuid]
    );
    return rows[0] || null;
  },

  async findValidByCourseAndParticipant(courseId, participantId) {
    const { rows } = await pool.query(
      `SELECT id FROM certificates
       WHERE course_id = $1 AND participant_id = $2 AND status = 'valid'`,
      [courseId, participantId]
    );
    return rows[0] || null;
  },

  async create({ uuid, participant_id, course_id, issued_by, issue_date, branding_version_id, template_id, pdf_path }) {
    const { rows } = await pool.query(
      `INSERT INTO certificates
         (uuid, participant_id, course_id, issued_by, issue_date, branding_version_id, template_id, pdf_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'valid')
       RETURNING *`,
      [uuid, participant_id, course_id, issued_by, issue_date, branding_version_id, template_id, pdf_path]
    );
    return rows[0];
  },

  async revoke(id, { revoked_by, revocation_reason }) {
    const { rows } = await pool.query(
      `UPDATE certificates
       SET status = 'revoked',
           revocation_reason = $2,
           revoked_at = NOW(),
           revoked_by = $3
       WHERE id = $1
       RETURNING *`,
      [id, revocation_reason, revoked_by]
    );
    return rows[0] || null;
  },
};

module.exports = Certificate;
