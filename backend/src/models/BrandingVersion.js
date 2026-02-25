const pool = require('../config/database');

const BrandingVersion = {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT bv.*, u.full_name AS created_by_name
       FROM branding_versions bv
       LEFT JOIN users u ON bv.created_by = u.id
       ORDER BY bv.created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT bv.*, u.full_name AS created_by_name
       FROM branding_versions bv
       LEFT JOIN users u ON bv.created_by = u.id
       WHERE bv.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findActive() {
    const { rows } = await pool.query(
      `SELECT bv.*, u.full_name AS created_by_name
       FROM branding_versions bv
       LEFT JOIN users u ON bv.created_by = u.id
       WHERE bv.is_active = true
       LIMIT 1`
    );
    return rows[0] || null;
  },

  async create({ version_label, logo_path, primary_color, secondary_color, font_family, organization_name, created_by }) {
    const { rows } = await pool.query(
      `INSERT INTO branding_versions
         (version_label, logo_path, primary_color, secondary_color, font_family, organization_name, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7)
       RETURNING *`,
      [version_label, logo_path, primary_color, secondary_color, font_family, organization_name, created_by]
    );
    return rows[0];
  },

  async deactivateAll() {
    await pool.query('UPDATE branding_versions SET is_active = false');
  },

  async activate(id) {
    const { rows } = await pool.query(
      `UPDATE branding_versions SET is_active = true WHERE id = $1 RETURNING *`,
      [id]
    );
    return rows[0] || null;
  },

  async updateLogoPath(id, logo_path) {
    const { rows } = await pool.query(
      `UPDATE branding_versions SET logo_path = $2 WHERE id = $1 RETURNING *`,
      [id, logo_path]
    );
    return rows[0] || null;
  },

  async update(id, { version_label, primary_color, secondary_color, font_family, organization_name }) {
    const { rows } = await pool.query(
      `UPDATE branding_versions
       SET version_label     = COALESCE($2, version_label),
           primary_color     = COALESCE($3, primary_color),
           secondary_color   = COALESCE($4, secondary_color),
           font_family       = COALESCE($5, font_family),
           organization_name = COALESCE($6, organization_name)
       WHERE id = $1
       RETURNING *`,
      [id, version_label, primary_color, secondary_color, font_family, organization_name]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM branding_versions WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = BrandingVersion;
