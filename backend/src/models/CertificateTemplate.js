const pool = require('../config/database');

const CertificateTemplate = {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT id, name, slug, description, orientation, page_size, thumbnail_path, is_default, is_active, created_at, created_by
       FROM certificate_templates
       WHERE is_active = true
       ORDER BY is_default DESC, name ASC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM certificate_templates WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const { rows } = await pool.query(
      'SELECT * FROM certificate_templates WHERE slug = $1',
      [slug]
    );
    return rows[0] || null;
  },

  async findDefault() {
    const { rows } = await pool.query(
      'SELECT * FROM certificate_templates WHERE is_default = true AND is_active = true'
    );
    return rows[0] || null;
  },

  async create({ name, slug, description, html_content, orientation, page_size, created_by }) {
    const { rows } = await pool.query(
      `INSERT INTO certificate_templates (name, slug, description, html_content, orientation, page_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, slug, description, html_content, orientation || 'landscape', page_size || 'letter', created_by]
    );
    return rows[0];
  },

  async update(id, { name, slug, description, html_content, orientation, page_size }) {
    const { rows } = await pool.query(
      `UPDATE certificate_templates
       SET name = COALESCE($2, name),
           slug = COALESCE($3, slug),
           description = COALESCE($4, description),
           html_content = COALESCE($5, html_content),
           orientation = COALESCE($6, orientation),
           page_size = COALESCE($7, page_size)
       WHERE id = $1
       RETURNING *`,
      [id, name, slug, description, html_content, orientation, page_size]
    );
    return rows[0] || null;
  },

  async deactivate(id) {
    const { rows } = await pool.query(
      'UPDATE certificate_templates SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },

  async setDefault(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE certificate_templates SET is_default = false WHERE is_default = true');
      const { rows } = await client.query(
        'UPDATE certificate_templates SET is_default = true WHERE id = $1 RETURNING *',
        [id]
      );
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = CertificateTemplate;
