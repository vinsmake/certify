const pool = require('../config/database');

const CourseParticipant = {
  async findByCourse(courseId) {
    const { rows } = await pool.query(
      `SELECT cp.id, cp.enrollment_date, cp.attendance_status,
              p.id AS participant_id, p.document_id, p.full_name, p.email,
              p.organization, p.position
       FROM course_participants cp
       JOIN participants p ON cp.participant_id = p.id
       WHERE cp.course_id = $1
       ORDER BY p.full_name ASC`,
      [courseId]
    );
    return rows;
  },

  async enroll(courseId, participantId) {
    const { rows } = await pool.query(
      `INSERT INTO course_participants (course_id, participant_id)
       VALUES ($1, $2)
       RETURNING *`,
      [courseId, participantId]
    );
    return rows[0];
  },

  async updateStatus(courseId, participantId, attendanceStatus) {
    const { rows } = await pool.query(
      `UPDATE course_participants
       SET attendance_status = $3
       WHERE course_id = $1 AND participant_id = $2
       RETURNING *`,
      [courseId, participantId, attendanceStatus]
    );
    return rows[0] || null;
  },

  async remove(courseId, participantId) {
    const { rows } = await pool.query(
      `DELETE FROM course_participants
       WHERE course_id = $1 AND participant_id = $2
       RETURNING *`,
      [courseId, participantId]
    );
    return rows[0] || null;
  },

  async findEnrollment(courseId, participantId) {
    const { rows } = await pool.query(
      `SELECT * FROM course_participants
       WHERE course_id = $1 AND participant_id = $2`,
      [courseId, participantId]
    );
    return rows[0] || null;
  },
};

module.exports = CourseParticipant;
