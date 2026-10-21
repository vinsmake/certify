import { certificateApi } from '../../api';
import { keys } from '../../api/keys';
import { useApiMutation } from '../../api/useApiMutation';
import { downloadBlob } from '../../lib/files';

/** Descarga el PDF vigente del certificado (requiere JWT, por eso no es un enlace directo). */
export const downloadCertificate = async (cert: { id: number; uuid: string }) =>
  downloadBlob(await certificateApi.pdf(cert.id), `certificado_${cert.uuid}.pdf`);

/** Queries que cambian cuando cambia un certificado. */
export const CERTIFICATE_RELATED = [keys.certificates.all, keys.courses.all, keys.participants.all, keys.stats.all];

export const useRevokeCertificate = (onSuccess?: () => void) =>
  useApiMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => certificateApi.revoke(id, reason),
    invalidate: CERTIFICATE_RELATED,
    success: 'Certificado revocado.',
    onSuccess,
  });
