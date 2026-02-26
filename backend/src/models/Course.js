const pool = require('../config/database');

const DEPS_SUBQUERY = `
  COALESCE(
    (SELECT json_agg(json_build_object('id', d2.id, 'name', d2.name) ORDER BY cd2.display_order)
     FROM course_dependencies cd2
     JOIN dependencies d2 ON d2.id = cd2.dependency_id
     WHERE cd2.course_id = c.id),
    '[]'::json
  ) AS dependencies`;

const Course = {
  async findAll({ dependency_id, search, type, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (dependency_id) {
      conditions.push(`EXISTS (SELECT 1 FROM course_dependencies cd WHERE cd.course_id = c.id AND cd.dependency_id = $${idx++})`);
      params.push(dependency_id);
    }
    if (search) {
      conditions.push(`c.name ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }
    if (type) {
      conditions.push(`c.type = $${idx++}`);
      params.push(type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT c.*, ${DEPS_SUBQUERY}, u.full_name AS created_by_name
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}`;

    const countQuery = `SELECT COUNT(*) FROM courses c ${where}`;

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
      `SELECT c.*, ${DEPS_SUBQUERY}, u.full_name AS created_by_name
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, description, type, duration_hours, instructor, start_date, end_date, dependency_id, created_by }) {
    const { rows } = await pool.query(
      `INSERT INTO courses (name, description, type, duration_hours, instructor, start_date, end_date, dependency_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, description, type, duration_hours, instructor, start_date || null, end_date || null, dependency_id, created_by]
    );
    return rows[0];
  },

  async updateSignature(id, signaturePath) {
    const { rows } = await pool.query(
      `UPDATE courses SET signature_path = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, signaturePath]
    );
    return rows[0] || null;
  },

  async update(id, { name, description, type, duration_hours, instructor, start_date, end_date, dependency_id }) {
    const { rows } = await pool.query(
      `UPDATE courses
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           type = COALESCE($4, type),
           duration_hours = COALESCE($5, duration_hours),
           instructor = COALESCE($6, instructor),
           start_date = COALESCE($7, start_date),
           end_date = COALESCE($8, end_date),
           dependency_id = $9,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, description, type, duration_hours, instructor, start_date, end_date, dependency_id ?? null]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = Course;
