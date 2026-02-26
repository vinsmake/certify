const Tag = require('../models/Tag');

const listTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll();
    res.json(tags);
  } catch (err) {
    next(err);
  }
};

const getTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });
    res.json(tag);
  } catch (err) {
    next(err);
  }
};

const createTag = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;
    const tag = await Tag.create({ name, slug, description });
    res.status(201).json(tag);
  } catch (err) {
    // Slug duplicado
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un tag con ese slug' });
    }
    next(err);
  }
};

const updateTag = async (req, res, next) => {
  try {
    const { name, slug, description, is_active } = req.body;
    const tag = await Tag.update(req.params.id, { name, slug, description, is_active });
    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });
    res.json(tag);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un tag con ese slug' });
    }
    next(err);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.delete(req.params.id);
    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });
    res.json({ message: 'Tag eliminado', id: tag.id });
  } catch (err) {
    next(err);
  }
};

const uploadTagLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de logo requerido' });
    }
    const logoPath = '/storage/logos/tags/' + req.file.filename;
    const tag = await Tag.updateLogo(req.params.id, logoPath);
    if (!tag) return res.status(404).json({ error: 'Tag no encontrado' });
    res.json({ message: 'Logo actualizado', logo_path: logoPath });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTags, getTag, createTag, updateTag, deleteTag, uploadTagLogo };
