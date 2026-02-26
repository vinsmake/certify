const Course = require('../models/Course');
const CourseDependency = require('../models/CourseDependency');
const CourseParticipant = require('../models/CourseParticipant');
const Participant = require('../models/Participant');
const { ensureDirectoryExists } = require('../utils/fileUtils');

// Helper: verifica que el usuario tiene acceso al curso (admin siempre, dependencia si esta en course_dependencies)
const checkCourseAccess = async (course, user) => {
  if (user.role === 'admin') return true;
  return CourseDependency.hasAccess(course.id, user.dependency_id);
};

const listCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const type   = req.query.type   || '';
    const result = await Course.findAll({
      dependency_id: req.dependencyFilter,
      search,
      type,
      page,
      limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const dependencies = await CourseDependency.findByCourse(course.id);
    res.json({ ...course, dependencies });
  } catch (err) {
    next(err);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { name, description, type, duration_hours, instructor, start_date, end_date, dependency_ids } = req.body;

    // La dependencia primaria del curso es la del usuario creador (si es dependencia)
    const dependency_id = req.user.role === 'dependencia'
      ? req.user.dependency_id
      : null;

    const course = await Course.create({
      name,
      description,
      type,
      duration_hours,
      instructor,
      start_date,
      end_date,
      dependency_id,
      created_by: req.user.userId,
    });

    // Agregar dependencias colaboradoras
    if (req.user.role === 'dependencia') {
      // La dependencia del usuario siempre es colaboradora
      await CourseDependency.addDependency(course.id, req.user.dependency_id, 1);
    } else if (req.user.role === 'admin' && Array.isArray(dependency_ids)) {
      for (const depId of dependency_ids) {
        try {
          await CourseDependency.addDependency(course.id, depId, 1);
        } catch (e) {
          if (e.code !== '23505') throw e;
        }
      }
    }

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para editar este curso' });
    }

    const { name, description, type, duration_hours, instructor, start_date, end_date } = req.body;

    const updated = await Course.update(req.params.id, {
      name, description, type, duration_hours, instructor, start_date, end_date,
      dependency_id: course.dependency_id,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este curso' });
    }

    await Course.delete(req.params.id);
    res.json({ message: 'Curso eliminado', id: course.id });
  } catch (err) {
    next(err);
  }
};

// Solo admin puede agregar/quitar dependencias colaboradoras
const addCourseDependency = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede gestionar dependencias colaboradoras' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const { dependency_id, display_order } = req.body;
    const cd = await CourseDependency.addDependency(course.id, dependency_id, display_order);
    res.status(201).json(cd);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esta dependencia ya esta asociada al curso' });
    }
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    next(err);
  }
};

const removeCourseDependency = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede gestionar dependencias colaboradoras' });
    }

    const removed = await CourseDependency.removeDependency(req.params.id, req.params.depId);
    if (!removed) {
      return res.status(404).json({ error: 'Asociacion no encontrada' });
    }
    res.json({ message: 'Dependencia removida del curso' });
  } catch (err) {
    next(err);
  }
};

const listCourseParticipants = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para ver este curso' });
    }

    const participants = await CourseParticipant.findByCourse(req.params.id);
    res.json({ course_id: course.id, course_name: course.name, participants });
  } catch (err) {
    next(err);
  }
};

const enrollParticipants = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar este curso' });
    }

    const { participant_ids } = req.body;
    const results = { enrolled: [], already_enrolled: [], not_found: [] };

    for (const participantId of participant_ids) {
      const participant = await Participant.findById(participantId);
      if (!participant) {
        results.not_found.push(participantId);
        continue;
      }

      const existing = await CourseParticipant.findEnrollment(req.params.id, participantId);
      if (existing) {
        results.already_enrolled.push(participantId);
        continue;
      }

      await CourseParticipant.enroll(req.params.id, participantId);
      results.enrolled.push(participantId);
    }

    res.status(201).json(results);
  } catch (err) {
    next(err);
  }
};

const updateParticipantStatus = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para gestionar este curso' });
    }

    const { attendance_status } = req.body;
    const updated = await CourseParticipant.updateStatus(
      req.params.id,
      req.params.participantId,
      attendance_status
    );

    if (!updated) {
      return res.status(404).json({ error: 'Inscripcion no encontrada' });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const uploadSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de firma requerido' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para editar este curso' });
    }

    const signaturePath = '/storage/signatures/' + req.file.filename;
    const updated = await Course.updateSignature(req.params.id, signaturePath);
    res.json({ message: 'Firma actualizada', signature_path: signaturePath, course: updated });
  } catch (err) {
    next(err);
  }
};

const deleteSignature = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const hasAccess = await checkCourseAccess(course, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes permisos para editar este curso' });
    }

    const updated = await Course.updateSignature(req.params.id, null);
    res.json({ message: 'Firma eliminada', course: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  addCourseDependency, removeCourseDependency,
  listCourseParticipants, enrollParticipants, updateParticipantStatus,
  uploadSignature, deleteSignature,
};
