const BrandingVersion = require('../models/BrandingVersion');

/**
 * Crea una nueva version de branding (inactiva por defecto).
 * El logo se asigna despues via uploadLogo.
 */
const createVersion = async ({ version_label, logo_path, primary_color, secondary_color, font_family, organization_name, created_by }) => {
  return await BrandingVersion.create({
    version_label,
    logo_path: logo_path || '/storage/logos/branding/default_logo.png',
    primary_color,
    secondary_color,
    font_family,
    organization_name,
    created_by,
  });
};

/**
 * Activa una version de branding desactivando todas las demas.
 * Garantiza que siempre haya exactamente una version activa.
 */
const activateVersion = async (id) => {
  const version = await BrandingVersion.findById(id);
  if (!version) return null;

  await BrandingVersion.deactivateAll();
  return await BrandingVersion.activate(id);
};

/**
 * Actualiza la ruta del logo de una version.
 */
const updateLogo = async (id, logo_path) => {
  return await BrandingVersion.updateLogoPath(id, logo_path);
};

module.exports = { createVersion, activateVersion, updateLogo };
