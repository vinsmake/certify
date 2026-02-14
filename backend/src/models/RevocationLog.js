const pool = require('../config/database');

const RevocationLog = {
  async create({ certificate_id, revoked_by, reason }) {
    const { rows } = await pool.query(
      `INSERT INTO revocation_log (certificate_id, revoked_by, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [certificate_id, revoked_by, reason]
    );
    return rows[0];
  },

  async findByCertificate(certificateId) {
    const { rows } = await pool.query(
      `SELECT rl.*, u.full_name AS revoked_by_name
       FROM revocation_log rl
       LEFT JOIN users u ON rl.revoked_by = u.id
       WHERE rl.certificate_id = $1
       ORDER BY rl.revoked_at DESC`,
      [certificateId]
    );
    return rows;
  },
};

module.exports = RevocationLog;
