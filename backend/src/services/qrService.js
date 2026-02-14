const QRCode = require('qrcode');
const { VERIFICATION_BASE_URL } = require('../config/environment');

/**
 * Genera un codigo QR en formato base64 (data URL) para un certificado.
 * La URL incrustada en el QR es: VERIFICATION_BASE_URL + "/" + uuid
 *
 * @param {string} uuid - UUID del certificado
 * @returns {Promise<string>} - Data URL base64 de la imagen QR (png)
 */
const generateQR = async (uuid) => {
  const url = `${VERIFICATION_BASE_URL}/${uuid}`;

  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 1,
    width: 200,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return dataUrl;
};

module.exports = { generateQR };
