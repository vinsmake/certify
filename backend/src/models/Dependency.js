const pool = require('../config/database');

const Dependency = {
  async findAll() {
    const { rows } = await pool.query(
      'SELECT * FROM dependencies ORDER BY name ASC'
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM dependencies WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, abbreviation, logo_path }) {
    const { rows } = await pool.query(
      `INSERT INTO dependencies (name, abbreviation, logo_path)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, abbreviation || null, logo_path || null]
    );
    return rows[0];
  },

  async update(id, { name, abbreviation, logo_path, is_active }) {
    const { rows } = await pool.query(
      `UPDATE dependencies
       SET name = COALESCE($2, name),
           abbreviation = COALESCE($3, abbreviation),
           logo_path = COALESCE($4, logo_path),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, abbreviation, logo_path, is_active]
    );
    return rows[0] || null;
  },

  async deactivate(id) {
    const { rows } = await pool.query(
      `UPDATE dependencies SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = Dependency;
