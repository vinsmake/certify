const pool = require('../config/database');

const BASE_SELECT = `
  SELECT p.id, p.full_name, p.email, p.dependency_id,
         d.name AS dependency_name,
         p.created_at, p.updated_at
  FROM participants p
  LEFT JOIN dependencies d ON p.dependency_id = d.id`;

const Participant = {
  async findAll({ page = 1, limit = 20, search = '', dependency_id = null }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (dependency_id) {
      conditions.push(`p.dependency_id = $${idx++}`);
      params.push(dependency_id);
    }
    if (search) {
      conditions.push(`p.full_name ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `${BASE_SELECT} ${where} ORDER BY p.full_name ASC LIMIT $${idx++} OFFSET $${idx}`;
    const countQuery = `SELECT COUNT(*) FROM participants p ${where}`;

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
      `${BASE_SELECT} WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ full_name, email, dependency_id }) {
    const { rows } = await pool.query(
      `INSERT INTO participants (full_name, email, dependency_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [full_name, email || null, dependency_id || null]
    );
    return rows[0];
  },

  async update(id, { full_name, email, dependency_id }) {
    const { rows } = await pool.query(
      `UPDATE participants
       SET full_name     = COALESCE($2, full_name),
           email         = COALESCE($3, email),
           dependency_id = COALESCE($4, dependency_id),
           updated_at    = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, full_name, email, dependency_id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM participants WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = Participant;
