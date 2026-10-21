// Pestaña Certificados: certificados emitidos del curso con descarga, reimpresion y revocacion.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CertificateListItem, CertificateStatus } from '@certify/shared';
import { certificateApi } from '../../../api';
import { keys } from '../../../api/keys';
import { paginatedOptions } from '../../../api/queries';
import { CertificateDetailModal } from '../../../components/certificates/CertificateDetailModal';
import { downloadCertificate, useReprintCertificate } from '../../../components/certificates/certificateActions';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Select } from '../../../components/ui/Field';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { PAGE_SIZE } from '../../../config';
import { formatDate, shortUuid } from '../../../lib/format';
import { toast } from '../../../lib/toast';
import type { CourseTabProps } from '../CoursePage';

const STATUS_OPTIONS = [
  { value: 'valid', label: 'Validos' },
  { value: 'revoked', label: 'Revocados' },
];

export const CertificatesTab = ({ course }: CourseTabProps) => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<CertificateStatus | ''>('');
  const [viewId, setViewId] = useState<number | null>(null);
  const [reprinting, setReprinting] = useState<CertificateListItem | null>(null);

  const params = { page, limit: PAGE_SIZE, course_id: course.id, status };
  const { data, isFetching } = useQuery({
    queryKey: keys.certificates.list(params),
    queryFn: () => certificateApi.list(params),
    ...paginatedOptions,
  });
  const reprint = useReprintCertificate(() => setReprinting(null));

  const download = (cert: CertificateListItem) =>
    downloadCertificate(cert).catch(() => toast.error('No se pudo descargar el PDF.'));

  return (
    <div className="stack">
      <div className="filters" style={{ marginBottom: 0 }}>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CertificateStatus | '');
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          placeholder="Todos"
        />
      </div>

      <Table
        rows={data?.data}
        loading={isFetching}
        rowKey={(c) => c.id}
        empty="Aun no se han emitido certificados en este curso."
        columns={[
          {
            key: 'participant',
            header: 'Participante',
            render: (c) => (
              <button className="btn btn--link" onClick={() => setViewId(c.id)}>
                {c.participant_name}
              </button>
            ),
          },
          {
            key: 'uuid',
            header: 'QR / UUID',
            render: (c) => (
              <a className="mono" href={`/verificar/${c.uuid}`} target="_blank" rel="noreferrer" title="Abrir la pagina de verificacion">
                {shortUuid(c.uuid)}
              </a>
            ),
          },
          { key: 'date', header: 'Emision', render: (c) => formatDate(c.issue_date) },
          { key: 'template', header: 'Diseño', render: (c) => c.template_name ?? '—' },
          {
            key: 'reprints',
            header: 'Reimpresiones',
            className: 'num',
            render: (c) => (c.reprint_count ? <span title={`Ultima: ${formatDate(c.last_reprinted_at)}`}>{c.reprint_count}</span> : 0),
          },
          { key: 'status', header: 'Estado', render: (c) => <Badge status={c.status} /> },
          {
            key: 'actions',
            header: '',
            render: (c) => (
              <div className="table__actions">
                <Button size="sm" variant="ghost" onClick={() => download(c)}>
                  PDF
                </Button>
                {c.status === 'valid' && (
                  <Button size="sm" variant="secondary" onClick={() => setReprinting(c)}>
                    Reimprimir
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setViewId(c.id)}>
                  Detalle
                </Button>
              </div>
            ),
          },
        ]}
      />
      {data && <Pagination page={page} total={data.total} limit={PAGE_SIZE} onChange={setPage} />}

      <CertificateDetailModal certificateId={viewId} onClose={() => setViewId(null)} />

      <ConfirmDialog
        open={!!reprinting}
        onClose={() => setReprinting(null)}
        onConfirm={() => reprinting && reprint.mutate(reprinting.id)}
        loading={reprint.isPending}
        title="Reimprimir certificado"
        confirmLabel="Reimprimir"
        variant="primary"
      >
        <p>
          Se regenerara el PDF de <strong>{reprinting?.participant_name}</strong> con los datos y el diseño actuales del curso.
        </p>
        <p className="small">
          Se conservan el mismo QR (uuid), la fecha de emision y el branding original, asi que las copias impresas anteriores
          siguen verificando igual.
        </p>
      </ConfirmDialog>
    </div>
  );
};
