const pool = require('../config/database');

const Course = {
  async findAll({ dependency_id, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    let query, countQuery, params, countParams;

    if (dependency_id) {
      query = `SELECT c.*, d.name AS dependency_name, u.full_name AS created_by_name
               FROM courses c
               LEFT JOIN dependencies d ON c.dependency_id = d.id
               LEFT JOIN users u ON c.created_by = u.id
               WHERE c.dependency_id = $1
               ORDER BY c.created_at DESC
               LIMIT $2 OFFSET $3`;
      countQuery = 'SELECT COUNT(*) FROM courses WHERE dependency_id = $1';
      params = [dependency_id, limit, offset];
      countParams = [dependency_id];
    } else {
      query = `SELECT c.*, d.name AS dependency_name, u.full_name AS created_by_name
               FROM courses c
               LEFT JOIN dependencies d ON c.dependency_id = d.id
               LEFT JOIN users u ON c.created_by = u.id
               ORDER BY c.created_at DESC
               LIMIT $1 OFFSET $2`;
      countQuery = 'SELECT COUNT(*) FROM courses';
      params = [limit, offset];
      countParams = [];
    }

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
      `SELECT c.*, d.name AS dependency_name, u.full_name AS created_by_name
       FROM courses c
       LEFT JOIN dependencies d ON c.dependency_id = d.id
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
