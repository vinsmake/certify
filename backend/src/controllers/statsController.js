const pool = require('../config/database');

// 17.01 - GET /api/stats - totales globales (solo admin)
const getGlobalStats = async (req, res, next) => {
  try {
    const { rows: totals } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM courses)                                    AS total_courses,
        (SELECT COUNT(*) FROM participants)                               AS total_participants,
        (SELECT COUNT(*) FROM certificates)                               AS total_certificates,
        (SELECT COUNT(*) FROM certificates WHERE status = 'valid')        AS certificates_valid,
        (SELECT COUNT(*) FROM certificates WHERE status = 'revoked')      AS certificates_revoked
    `);

    const { rows: byDependency } = await pool.query(`
      SELECT
        d.id,
        d.name,
        d.abbreviation,
        COUNT(DISTINCT co.id)                                                          AS total_courses,
        COUNT(DISTINCT cert.id)                                                        AS total_certificates,
        COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid')                  AS certificates_valid,
        COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'revoked')                AS certificates_revoked,
        COUNT(DISTINCT u.id)                                                           AS total_users
      FROM dependencies d
      LEFT JOIN courses co   ON co.dependency_id = d.id
      LEFT JOIN certificates cert ON cert.course_id = co.id
      LEFT JOIN users u      ON u.dependency_id = d.id AND u.is_active = true
      WHERE d.is_active = true
      GROUP BY d.id, d.name, d.abbreviation
      ORDER BY d.name
    `);

    res.json({
      totals: {
        courses:               parseInt(totals[0].total_courses),
        participants:          parseInt(totals[0].total_participants),
        certificates:          parseInt(totals[0].total_certificates),
        certificates_valid:    parseInt(totals[0].certificates_valid),
        certificates_revoked:  parseInt(totals[0].certificates_revoked),
      },
      by_dependency: byDependency.map((row) => ({
        id:                    row.id,
        name:                  row.name,
        abbreviation:          row.abbreviation,
        total_courses:         parseInt(row.total_courses),
        total_certificates:    parseInt(row.total_certificates),
        certificates_valid:    parseInt(row.certificates_valid),
        certificates_revoked:  parseInt(row.certificates_revoked),
        total_users:           parseInt(row.total_users),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// 17.02 - GET /api/stats/dependency/:id - estadisticas de una dependencia (solo admin)
const getDependencyStats = async (req, res, next) => {
  try {
    const depId = parseInt(req.params.id);

    const { rows: dep } = await pool.query(
      'SELECT id, name, abbreviation FROM dependencies WHERE id = $1 AND is_active = true',
      [depId]
    );
    if (!dep.length) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }

    const { rows: stats } = await pool.query(`
      SELECT
        COUNT(DISTINCT co.id)                                                     AS total_courses,
        COUNT(DISTINCT cp.participant_id)                                         AS total_participants,
        COUNT(DISTINCT cert.id)                                                   AS total_certificates,
        COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid')             AS certificates_valid,
        COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'revoked')           AS certificates_revoked,
        COUNT(DISTINCT u.id)                                                      AS total_users
      FROM dependencies d
      LEFT JOIN courses co          ON co.dependency_id = d.id
      LEFT JOIN course_participants cp ON cp.course_id = co.id
      LEFT JOIN certificates cert   ON cert.course_id = co.id
      LEFT JOIN users u             ON u.dependency_id = d.id AND u.is_active = true
      WHERE d.id = $1
    `, [depId]);

    res.json({
      dependency: dep[0],
      stats: {
        total_courses:         parseInt(stats[0].total_courses),
        total_participants:    parseInt(stats[0].total_participants),
        total_certificates:    parseInt(stats[0].total_certificates),
        certificates_valid:    parseInt(stats[0].certificates_valid),
        certificates_revoked:  parseInt(stats[0].certificates_revoked),
        total_users:           parseInt(stats[0].total_users),
      },
    });
  } catch (err) {
    next(err);
  }
};

// 17.03 - GET /api/stats/me - estadisticas de la dependencia del usuario actual
const getMyStats = async (req, res, next) => {
  try {
    // Admin sin dependencia: devuelve globales
    if (req.user.role === 'admin' && !req.user.dependency_id) {
      return getGlobalStats(req, res, next);
    }

    const depId = req.user.dependency_id;

    const { rows: dep } = await pool.query(
      'SELECT id, name, abbreviation FROM dependencies WHERE id = $1',
      [depId]
    );
    if (!dep.length) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }

    const { rows: stats } = await pool.query(`
      SELECT
        COUNT(DISTINCT co.id)                                                     AS total_courses,
        COUNT(DISTINCT cp.participant_id)                                         AS total_participants,
        COUNT(DISTINCT cert.id)                                                   AS total_certificates,
        COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'valid')             AS certificates_valid,
        COUNT(DISTINCT cert.id) FILTER (WHERE cert.status = 'revoked')           AS certificates_revoked
      FROM dependencies d
      LEFT JOIN courses co          ON co.dependency_id = d.id
      LEFT JOIN course_participants cp ON cp.course_id = co.id
      LEFT JOIN certificates cert   ON cert.course_id = co.id
      WHERE d.id = $1
    `, [depId]);

    res.json({
      dependency: dep[0],
      stats: {
        total_courses:         parseInt(stats[0].total_courses),
        total_participants:    parseInt(stats[0].total_participants),
        total_certificates:    parseInt(stats[0].total_certificates),
        certificates_valid:    parseInt(stats[0].certificates_valid),
        certificates_revoked:  parseInt(stats[0].certificates_revoked),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGlobalStats, getDependencyStats, getMyStats };
