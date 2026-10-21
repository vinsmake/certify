import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CertificateDetail } from '@certify/shared';
import { certificateApi } from '../../api';
import { keys } from '../../api/keys';
import { courseTypeLabel, formatDate, formatDateTime } from '../../lib/format';
import { toast } from '../../lib/toast';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { downloadCertificate, useRevokeCertificate } from './certificateActions';

const Section = ({ title, rows }: { title: string; rows: [string, ReactNode][] }) => (
  <section className="section">
    <h3 className="section__title">{title}</h3>
    <dl className="dl">
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'contents' }}>
          <dt>{label}</dt>
          <dd>{value || '—'}</dd>
        </div>
      ))}
    </dl>
  </section>
);

const RevokeForm = ({ cert, onDone, onCancel }: { cert: CertificateDetail; onDone: () => void; onCancel: () => void }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const revoke = useRevokeCertificate(onDone);

  const submit = () => {
    if (!reason.trim()) return setError('La razon es requerida.');
    revoke.mutate({ id: cert.id, reason: reason.trim() });
  };

  return (
    <div className="card stack-sm" style={{ borderColor: 'var(--color-danger)' }}>
      <h3 className="text-danger">Revocar certificado</h3>
      <p className="small">
        Esta accion es irreversible. La pagina de verificacion mostrara el certificado como revocado.
      </p>
      <Textarea
        rows={3}
        value={reason}
        error={error}
        placeholder="Razon de la revocacion"
        onChange={(e) => {
          setReason(e.target.value);
          setError('');
        }}
      />
      <div className="row-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={submit} loading={revoke.isPending}>
          Confirmar revocacion
        </Button>
      </div>
    </div>
  );
};

const Detail = ({ cert, onClose }: { cert: CertificateDetail; onClose: () => void }) => {
  const [revoking, setRevoking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(cert);
    } catch {
      toast.error('No se pudo descargar el PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="stack">
      <div className="row">
        <Badge status={cert.status} />
        <span className="mono">{cert.uuid}</span>
      </div>

      <Section
        title="Participante"
        rows={[
          ['Nombre', cert.participant_name],
          ['Correo', cert.participant_email],
        ]}
      />
      <Section
        title="Curso"
        rows={[
          ['Nombre', cert.course_name],
          ['Tipo', courseTypeLabel(cert.course_type)],
          ['Dependencia', cert.dependency_name],
          ['Duracion', cert.duration_hours ? `${cert.duration_hours} h` : null],
          ['Instructor', cert.instructor],
          ['Periodo', `${formatDate(cert.start_date)} - ${formatDate(cert.end_date)}`],
        ]}
      />
      <Section
        title="Certificado"
        rows={[
          ['Fecha de emision', formatDate(cert.issue_date)],
          ['Emitido por', cert.issued_by_name],
          ['Plantilla', cert.template_name],
          ['Branding', cert.branding_label],
          ['Reimpresiones', cert.reprint_count ? `${cert.reprint_count} (ultima: ${formatDateTime(cert.last_reprinted_at)})` : '0'],
          ...(cert.status === 'revoked'
            ? ([
                ['Revocado el', formatDateTime(cert.revoked_at)],
                ['Razon', cert.revocation_reason],
              ] as [string, string | null][])
            : []),
        ]}
      />

      {revoking ? (
        <RevokeForm cert={cert} onDone={onClose} onCancel={() => setRevoking(false)} />
      ) : (
        <div className="row section">
          <Button onClick={download} loading={downloading} disabled={!cert.pdf_path}>
            Descargar PDF
          </Button>
          {cert.status === 'valid' && (
            <Button variant="danger" onClick={() => setRevoking(true)}>
              Revocar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/** Detalle de un certificado con descarga y revocacion. */
export const CertificateDetailModal = ({ certificateId, onClose }: { certificateId: number | null; onClose: () => void }) => {
  const { data } = useQuery({
    queryKey: keys.certificates.detail(certificateId ?? 0),
    queryFn: () => certificateApi.get(certificateId as number),
    enabled: certificateId !== null,
  });

  return (
    <Modal open={certificateId !== null} onClose={onClose} title="Detalle del certificado" size="lg">
      {data && data.id === certificateId ? <Detail cert={data} onClose={onClose} /> : <Spinner />}
    </Modal>
  );
};
