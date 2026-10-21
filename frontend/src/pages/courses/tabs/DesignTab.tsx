// Pestaña Diseño: elegir la plantilla del curso y ver el certificado con los datos reales del curso.
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { courseApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useTemplates } from '../../../api/queries';
import { useApiMutation } from '../../../api/useApiMutation';
import { useCurrentUser } from '../../../auth/useAuth';
import { CertificatePreview } from '../../../components/templates/CertificatePreview';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Field';
import { openBlob } from '../../../lib/files';
import { errorMessage } from '../../../lib/http';
import { toast } from '../../../lib/toast';
import type { CourseTabProps } from '../CoursePage';

export const DesignTab = ({ course }: CourseTabProps) => {
  const { isAdmin } = useCurrentUser();
  const templates = useTemplates();
  const defaultTemplate = templates.data?.find((t) => t.is_default) ?? templates.data?.[0];
  // '' = plantilla por defecto del sistema
  const [selected, setSelected] = useState(course.template_id ? String(course.template_id) : '');
  const [openingPdf, setOpeningPdf] = useState(false);

  // Siempre se pide la plantilla explicita para que "por defecto" se vea aunque el curso tenga otra
  const templateId = selected ? Number(selected) : defaultTemplate?.id;
  const preview = useQuery({
    queryKey: keys.courses.preview(course.id, templateId),
    queryFn: () => courseApi.previewHtml(course.id, templateId),
    enabled: templateId !== undefined,
    placeholderData: keepPreviousData,
  });

  const saved = (course.template_id ? String(course.template_id) : '') === selected;
  const save = useApiMutation({
    mutationFn: () => courseApi.update(course.id, { template_id: selected ? Number(selected) : null }),
    invalidate: [keys.courses.all],
    success: 'Diseño del curso guardado.',
  });

  const openPdf = async () => {
    setOpeningPdf(true);
    try {
      openBlob(await courseApi.previewPdf(course.id, templateId));
    } catch {
      toast.error('No se pudo generar el PDF de vista previa.');
    } finally {
      setOpeningPdf(false);
    }
  };

  return (
    <div className="stack">
      <div className="card stack-sm">
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <Select
            label="Plantilla del certificado"
            fieldClassName="grow"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            options={(templates.data ?? []).map((t) => ({ value: t.id, label: t.is_default ? `${t.name} (por defecto)` : t.name }))}
            placeholder={`Por defecto del sistema${defaultTemplate ? ` (${defaultTemplate.name})` : ''}`}
          />
          <Button onClick={() => save.mutate()} disabled={saved} loading={save.isPending}>
            {saved ? 'Guardado' : 'Usar este diseño'}
          </Button>
        </div>
        <p className="small">
          La vista previa usa los datos reales del curso (dependencias, firmas y branding activo) con un participante de
          ejemplo. Los certificados ya emitidos no cambian; para aplicar el nuevo diseño a uno existente, reimprimelo desde la
          pestaña Certificados (conserva el mismo QR).
          {isAdmin && ' Las plantillas se editan en Administracion > Plantillas.'}
        </p>
      </div>

      {preview.error ? (
        <Alert type="error">{errorMessage(preview.error, 'No se pudo generar la vista previa.')}</Alert>
      ) : (
        <CertificatePreview
          html={preview.data?.html}
          orientation={preview.data?.orientation ?? 'landscape'}
          pageSize={preview.data?.page_size ?? 'letter'}
          loading={preview.isFetching}
          toolbar={
            <Button size="sm" variant="secondary" onClick={openPdf} loading={openingPdf}>
              Ver como PDF
            </Button>
          }
        />
      )}
    </div>
  );
};
