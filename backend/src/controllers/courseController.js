const Course = require('../models/Course');
const CourseDependency = require('../models/CourseDependency');

const listCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await Course.findAll({
      dependency_id: req.dependencyFilter,
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
    const { name, description, type, duration_hours, instructor, start_date, end_date } = req.body;

    // Emisor: usa su dependency_id. Admin: usa el del body o null.
    const dependency_id = req.user.role === 'emisor'
      ? req.user.dependency_id
      : (req.body.dependency_id || null);

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

    // Auto-agregar la dependencia principal como colaboradora
    if (dependency_id) {
      await CourseDependency.addDependency(course.id, dependency_id, 1);
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

    // Emisor solo puede editar cursos de su dependencia
    if (req.user.role === 'emisor' && course.dependency_id !== req.user.dependency_id) {
      return res.status(403).json({ error: 'No tienes permisos para editar este curso' });
    }

    const { name, description, type, duration_hours, instructor, start_date, end_date } = req.body;
    const updated = await Course.update(req.params.id, {
      name, description, type, duration_hours, instructor, start_date, end_date,
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

    if (req.user.role === 'emisor' && course.dependency_id !== req.user.dependency_id) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este curso' });
    }

    await Course.delete(req.params.id);
    res.json({ message: 'Curso eliminado', id: course.id });
  } catch (err) {
    next(err);
  }
};

const addCourseDependency = async (req, res, next) => {
  try {
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
    const removed = await CourseDependency.removeDependency(req.params.id, req.params.depId);
    if (!removed) {
      return res.status(404).json({ error: 'Asociacion no encontrada' });
    }
    res.json({ message: 'Dependencia removida del curso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse, addCourseDependency, removeCourseDependency };
