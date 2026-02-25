const Dependency = require('../models/Dependency');

const listDependencies = async (req, res, next) => {
  try {
    const active_only = req.query.active_only === 'true';
    const dependencies = await Dependency.findAll({ active_only });
    res.json(dependencies);
  } catch (err) {
    next(err);
  }
};

const getDependency = async (req, res, next) => {
  try {
    const dependency = await Dependency.findById(req.params.id);
    if (!dependency) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    res.json(dependency);
  } catch (err) {
    next(err);
  }
};

const createDependency = async (req, res, next) => {
  try {
    const { name, abbreviation, manager_name } = req.body;
    const dependency = await Dependency.create({ name, abbreviation, manager_name });
    res.status(201).json(dependency);
  } catch (err) {
    next(err);
  }
};

const updateDependency = async (req, res, next) => {
  try {
    const { name, abbreviation, is_active, manager_name } = req.body;
    const dependency = await Dependency.update(req.params.id, { name, abbreviation, is_active, manager_name });
    if (!dependency) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    res.json(dependency);
  } catch (err) {
    next(err);
  }
};

const deactivateDependency = async (req, res, next) => {
  try {
    const dependency = await Dependency.deactivate(req.params.id);
    if (!dependency) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    res.json({ message: 'Dependencia desactivada', id: dependency.id });
  } catch (err) {
    next(err);
  }
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de logo requerido' });
    }

    const logoPath = '/storage/logos/dependencies/' + req.file.filename;
    const dependency = await Dependency.update(req.params.id, { logo_path: logoPath });

    if (!dependency) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }

    res.json({ message: 'Logo actualizado', logo_path: logoPath });
  } catch (err) {
    next(err);
  }
};

const uploadSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de firma requerido' });
    }
    const signaturePath = '/storage/signatures/' + req.file.filename;
    const dependency = await Dependency.updateSignature(req.params.id, signaturePath);
    if (!dependency) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    res.json({ message: 'Firma actualizada', signature_path: signaturePath });
  } catch (err) {
    next(err);
  }
};

const deleteSignature = async (req, res, next) => {
  try {
    const dependency = await Dependency.clearSignature(req.params.id);
    if (!dependency) {
      return res.status(404).json({ error: 'Dependencia no encontrada' });
    }
    res.json({ message: 'Firma eliminada' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listDependencies, getDependency, createDependency, updateDependency, deactivateDependency, uploadLogo, uploadSignature, deleteSignature };
