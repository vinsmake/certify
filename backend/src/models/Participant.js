const pool = require('../config/database');

const Participant = {
  async findAll({ page = 1, limit = 20, search = '' }) {
    const offset = (page - 1) * limit;
    let query, countQuery, params, countParams;

    if (search) {
      const searchPattern = `%${search}%`;
      query = `SELECT * FROM participants
               WHERE full_name ILIKE $1
               ORDER BY full_name ASC
               LIMIT $2 OFFSET $3`;
      countQuery = `SELECT COUNT(*) FROM participants
                    WHERE full_name ILIKE $1`;
      params = [searchPattern, limit, offset];
      countParams = [searchPattern];
    } else {
      query = `SELECT * FROM participants
               ORDER BY full_name ASC
               LIMIT $1 OFFSET $2`;
      countQuery = 'SELECT COUNT(*) FROM participants';
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
      'SELECT * FROM participants WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ full_name, email, organization, position }) {
    const { rows } = await pool.query(
      `INSERT INTO participants (full_name, email, organization, position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [full_name, email || null, organization || null, position || null]
    );
    return rows[0];
  },

  async update(id, { full_name, email, organization, position }) {
    const { rows } = await pool.query(
      `UPDATE participants
       SET full_name    = COALESCE($2, full_name),
           email        = COALESCE($3, email),
           organization = COALESCE($4, organization),
           position     = COALESCE($5, position),
           updated_at   = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, full_name, email, organization, position]
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
