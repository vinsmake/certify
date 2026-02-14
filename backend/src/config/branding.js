const BrandingVersion = require('../models/BrandingVersion');

/**
 * Obtiene la configuracion de branding activa.
 * Si no hay ninguna activa, devuelve null.
 */
const getActiveBranding = async () => {
  return await BrandingVersion.findActive();
};

module.exports = { getActiveBranding };
