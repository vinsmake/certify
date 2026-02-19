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

  async create({ name, abbreviation, logo_path, manager_name }) {
    const { rows } = await pool.query(
      `INSERT INTO dependencies (name, abbreviation, logo_path, manager_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, abbreviation || null, logo_path || null, manager_name || null]
    );
    return rows[0];
  },

  async update(id, { name, abbreviation, logo_path, is_active, manager_name }) {
    const { rows } = await pool.query(
      `UPDATE dependencies
       SET name = COALESCE($2, name),
           abbreviation = COALESCE($3, abbreviation),
           logo_path = COALESCE($4, logo_path),
           is_active = COALESCE($5, is_active),
           manager_name = COALESCE($6, manager_name),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name, abbreviation, logo_path, is_active, manager_name]
    );
    return rows[0] || null;
  },

  async updateSignature(id, signaturePath) {
    const { rows } = await pool.query(
      `UPDATE dependencies SET signature_path = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, signaturePath]
    );
    return rows[0] || null;
  },

  async clearSignature(id) {
    const { rows } = await pool.query(
      `UPDATE dependencies SET signature_path = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
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
