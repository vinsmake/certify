const pool = require('../config/database');

const Tag = {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT id, name, slug, description, logo_path, is_active, created_at, updated_at
       FROM tags
       ORDER BY created_at DESC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, name, slug, description, logo_path, is_active, created_at, updated_at
       FROM tags WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, slug, description }) {
    const { rows } = await pool.query(
      `INSERT INTO tags (name, slug, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, slug, description || null]
    );
    return rows[0];
  },

  async update(id, { name, slug, description, is_active }) {
    const { rows } = await pool.query(
      `UPDATE tags
       SET name        = COALESCE($2, name),
           slug        = COALESCE($3, slug),
           description = COALESCE($4, description),
           is_active   = COALESCE($5, is_active),
           updated_at  = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, name || null, slug || null, description !== undefined ? description : null, is_active !== undefined ? is_active : null]
    );
    return rows[0] || null;
  },

  async updateLogo(id, logo_path) {
    const { rows } = await pool.query(
      `UPDATE tags SET logo_path = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, logo_path]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rows } = await pool.query(
      'DELETE FROM tags WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  },

  // Obtener tags de un participante
  async getParticipantTags(participant_id) {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.slug, t.description, t.logo_path
       FROM tags t
       INNER JOIN participant_tags pt ON t.id = pt.tag_id
       WHERE pt.participant_id = $1
       ORDER BY t.created_at DESC`,
      [participant_id]
    );
    return rows;
  },

  // Reemplazar todos los tags de un participante
  async setParticipantTags(participant_id, tag_ids) {
    await pool.query(
      'DELETE FROM participant_tags WHERE participant_id = $1',
      [participant_id]
    );
    if (tag_ids && tag_ids.length > 0) {
      const values = tag_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO participant_tags (participant_id, tag_id) VALUES ${values}`,
        [participant_id, ...tag_ids]
      );
    }
  },
};

module.exports = Tag;
