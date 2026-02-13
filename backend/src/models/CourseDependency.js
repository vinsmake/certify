const pool = require('../config/database');

const CourseDependency = {
  async findByCourse(courseId) {
    const { rows } = await pool.query(
      `SELECT cd.*, d.name AS dependency_name, d.abbreviation, d.logo_path
       FROM course_dependencies cd
       JOIN dependencies d ON cd.dependency_id = d.id
       WHERE cd.course_id = $1
       ORDER BY cd.display_order ASC`,
      [courseId]
    );
    return rows;
  },

  async addDependency(courseId, dependencyId, displayOrder) {
    const { rows } = await pool.query(
      `INSERT INTO course_dependencies (course_id, dependency_id, display_order)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [courseId, dependencyId, displayOrder || 1]
    );
    return rows[0];
  },

  async removeDependency(courseId, dependencyId) {
    const { rows } = await pool.query(
      'DELETE FROM course_dependencies WHERE course_id = $1 AND dependency_id = $2 RETURNING *',
      [courseId, dependencyId]
    );
    return rows[0] || null;
  },

  async updateOrder(courseId, dependencyId, displayOrder) {
    const { rows } = await pool.query(
      `UPDATE course_dependencies
       SET display_order = $3
       WHERE course_id = $1 AND dependency_id = $2
       RETURNING *`,
      [courseId, dependencyId, displayOrder]
    );
    return rows[0] || null;
  },
};

module.exports = CourseDependency;
