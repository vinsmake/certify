const pool = require('../config/database');

const User = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT u.*, d.name AS dependency_name
       FROM users u
       LEFT JOIN dependencies d ON u.dependency_id = d.id
       WHERE u.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, password_hash, full_name, role, dependency_id }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, dependency_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, password_hash, full_name, role, dependency_id]
    );
    return rows[0];
  },

  async update(id, { email, full_name, role, dependency_id, is_active }) {
    const { rows } = await pool.query(
      `UPDATE users
       SET email = COALESCE($2, email),
           full_name = COALESCE($3, full_name),
           role = COALESCE($4, role),
           dependency_id = $5,
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, email, full_name, role, dependency_id, is_active]
    );
    return rows[0] || null;
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.dependency_id, u.is_active, u.created_at, u.updated_at,
              d.name AS dependency_name
       FROM users u
       LEFT JOIN dependencies d ON u.dependency_id = d.id
       ORDER BY u.created_at DESC`
    );
    return rows;
  },

  async findByDependency(dependencyId) {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.dependency_id, u.is_active, u.created_at, u.updated_at,
              d.name AS dependency_name
       FROM users u
       LEFT JOIN dependencies d ON u.dependency_id = d.id
       WHERE u.dependency_id = $1
       ORDER BY u.created_at DESC`,
      [dependencyId]
    );
    return rows;
  },

  async deactivate(id) {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = User;
