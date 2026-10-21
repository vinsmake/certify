import QRCode from 'qrcode';
import { env } from '../config/env';

export const verificationUrl = (uuid: string) => `${env.VERIFICATION_BASE_URL}/${uuid}`;

/** QR (data URL PNG) que apunta a la pagina publica de verificacion del certificado. */
export const generateQr = (uuid: string) =>
  QRCode.toDataURL(verificationUrl(uuid), {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 1,
    width: 200,
    color: { dark: '#000000', light: '#ffffff' },
  });
