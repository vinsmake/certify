const BrandingVersion = require('../models/BrandingVersion');
const brandingService = require('../services/brandingService');

// 11.04 - GET /active - branding activo (publico)
const getActive = async (req, res, next) => {
  try {
    const active = await BrandingVersion.findActive();
    if (!active) {
      return res.status(404).json({ error: 'No hay version de branding activa' });
    }
    res.json(active);
  } catch (err) {
    next(err);
  }
};

// 11.05 - GET /versions - listar todas las versiones (autenticado admin)
const listVersions = async (req, res, next) => {
  try {
    const versions = await BrandingVersion.findAll();
    res.json(versions);
  } catch (err) {
    next(err);
  }
};

// 11.06 - POST /versions - crear nueva version (admin)
const createVersion = async (req, res, next) => {
  try {
    const { version_label, primary_color, secondary_color, font_family, organization_name } = req.body;

    const version = await brandingService.createVersion({
      version_label,
      primary_color,
      secondary_color,
      font_family,
      organization_name,
      created_by: req.user.userId,
    });

    res.status(201).json(version);
  } catch (err) {
    next(err);
  }
};

// 11.07 - PUT /versions/:id/activate - activar una version (admin)
const activateVersion = async (req, res, next) => {
  try {
    const version = await brandingService.activateVersion(req.params.id);
    if (!version) {
      return res.status(404).json({ error: 'Version de branding no encontrada' });
    }
    res.json({ message: 'Version activada', version });
  } catch (err) {
    next(err);
  }
};

// 11.08 - POST /versions/:id/logo - subir logo institucional (admin)
const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo de logo requerido' });
    }

    const version = await BrandingVersion.findById(req.params.id);
    if (!version) {
      return res.status(404).json({ error: 'Version de branding no encontrada' });
    }

    const logoPath = '/storage/logos/branding/' + req.file.filename;
    const updated = await brandingService.updateLogo(req.params.id, logoPath);

    res.json({ message: 'Logo actualizado', logo_path: logoPath, version: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActive, listVersions, createVersion, activateVersion, uploadLogo };
