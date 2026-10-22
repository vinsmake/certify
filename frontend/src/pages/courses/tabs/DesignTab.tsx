// Pestaña Diseño: TODO lo que aparece en el certificado se edita aqui y es propio del curso (decision #11):
// HTML (copia propia de una plantilla base), formato, logo, organizacion, colores, fuente,
// firma del instructor y logo/firma/firmante de cada dependencia colaboradora.
// Los cambios de texto se guardan con "Guardar diseño"; las imagenes se guardan al subirlas.
import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CourseDesignInput, CourseDetail, Orientation, PageSize } from '@certify/shared';
import { courseApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useTemplates } from '../../../api/queries';
import { useApiMutation } from '../../../api/useApiMutation';
import { CertificatePreview } from '../../../components/templates/CertificatePreview';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Field, Input, Select, Textarea } from '../../../components/ui/Field';
import { FileButton } from '../../../components/ui/FileButton';
import { StoredImage } from '../../../components/ui/StoredImage';
import { openBlob } from '../../../lib/files';
import { errorMessage } from '../../../lib/http';
import { TEMPLATE_VARIABLES } from '../../../lib/templateVariables';
import { toast } from '../../../lib/toast';
import { useDebounced } from '../../../lib/useDebounced';
import type { CourseTabProps } from '../CoursePage';
import { CollaboratorsCard } from './CollaboratorsCard';

const FONTS = ['Roboto', 'Georgia', 'Arial', 'Times New Roman', 'Helvetica', 'Verdana', 'Trebuchet MS'];
const ORIENTATION_OPTIONS = [
  { value: 'landscape', label: 'Horizontal' },
  { value: 'portrait', label: 'Vertical' },
];
const PAGE_OPTIONS = [
  { value: 'letter', label: 'Carta' },
  { value: 'A4', label: 'A4' },
];
const HEX = /^#[0-9A-Fa-f]{6}$/;

type Draft = Omit<CourseDesignInput, 'organization_name'> & { organization_name: string };

const draftFrom = (c: CourseDetail): Draft => ({
  certificate_html: c.certificate_html,
  orientation: c.orientation,
  page_size: c.page_size,
  organization_name: c.organization_name ?? '',
  primary_color: c.primary_color,
  secondary_color: c.secondary_color,
  font_family: c.font_family,
});

/** Lo que se envia al backend: organizacion vacia = null; colores invalidos se omiten en la vista previa. */
const toPayload = (d: Draft, forPreview = false) => ({
  ...d,
  organization_name: d.organization_name.trim() || null,
  ...(forPreview && !HEX.test(d.primary_color) && { primary_color: undefined }),
  ...(forPreview && !HEX.test(d.secondary_color) && { secondary_color: undefined }),
  ...(forPreview && !d.certificate_html.trim() && { certificate_html: undefined }),
});

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <Field label={label} error={HEX.test(value) ? undefined : 'Formato #RRGGBB'}>
    {(id) => (
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input
          type="color"
          className="control-color"
          value={HEX.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <input id={id} className="control mono" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    )}
  </Field>
);

export const DesignTab = ({ course }: CourseTabProps) => {
  const templates = useTemplates();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(course));
  const [showPreview, setShowPreview] = useState(true);
  const [baseTemplateId, setBaseTemplateId] = useState('');
  const [confirmingTemplate, setConfirmingTemplate] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);

  const saved = draftFrom(course);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== saved[k]);
  const set = <K extends keyof Draft>(field: K) => (value: Draft[K]) => setDraft((prev) => ({ ...prev, [field]: value }));

  // Vista previa en vivo con el borrador (sin guardar) y los datos reales del curso
  const debounced = useDebounced(draft, 500);
  const preview = useQuery({
    queryKey: keys.courses.preview(course.id, debounced),
    queryFn: () => courseApi.previewHtml(course.id, toPayload(debounced, true)),
    enabled: showPreview,
    placeholderData: keepPreviousData,
  });

  const invalidate = [keys.courses.all];
  const save = useApiMutation({
    mutationFn: () => courseApi.updateDesign(course.id, toPayload(draft)),
    invalidate,
    success: 'Diseño guardado. Los certificados nuevos y las reimpresiones lo usaran.',
  });
  const applyTemplate = useApiMutation({
    mutationFn: (templateId: number) => courseApi.applyTemplate(course.id, templateId),
    invalidate,
    success: 'Plantilla base cargada en el curso.',
    onSuccess: (updated) => {
      setDraft((prev) => ({
        ...prev,
        certificate_html: updated.certificate_html,
        orientation: updated.orientation,
        page_size: updated.page_size,
      }));
      setConfirmingTemplate(false);
      setBaseTemplateId('');
    },
  });
  const uploadLogo = useApiMutation({
    mutationFn: (file: File) => courseApi.uploadLogo(course.id, file),
    invalidate,
    success: 'Logo actualizado.',
  });
  const deleteLogo = useApiMutation({ mutationFn: () => courseApi.deleteLogo(course.id), invalidate, success: 'Logo quitado.' });
  const uploadSignature = useApiMutation({
    mutationFn: (file: File) => courseApi.uploadSignature(course.id, file),
    invalidate,
    success: 'Firma del instructor actualizada.',
  });
  const deleteSignature = useApiMutation({
    mutationFn: () => courseApi.deleteSignature(course.id),
    invalidate,
    success: 'Firma del instructor quitada.',
  });

  const openPdf = async () => {
    setOpeningPdf(true);
    try {
      openBlob(await courseApi.previewPdf(course.id, toPayload(draft, true)));
    } catch {
      toast.error('No se pudo generar el PDF de vista previa.');
    } finally {
      setOpeningPdf(false);
    }
  };

  return (
    <div className="stack">
      <div className="card row-between">
        <p className="small grow">
          Todo lo que sale en el certificado se configura aqui y solo afecta a este curso. Los certificados ya emitidos no
          cambian hasta reimprimirlos (conservan su QR).
        </p>
        <div className="row">
          {dirty && <span className="small text-danger">Cambios sin guardar</span>}
          <Button variant="secondary" disabled={!dirty || save.isPending} onClick={() => setDraft(draftFrom(course))}>
            Descartar
          </Button>
          <Button disabled={!dirty} loading={save.isPending} onClick={() => save.mutate()}>
            Guardar diseño
          </Button>
        </div>
      </div>

      <div className="card stack">
        <h2>Identidad y formato</h2>
        <div className="grid-2">
          <Input
            label="Organizacion emisora"
            value={draft.organization_name}
            onChange={(e) => set('organization_name')(e.target.value)}
            placeholder="Nombre que aparece en el certificado"
          />
          <Select
            label="Fuente"
            value={draft.font_family}
            onChange={(e) => set('font_family')(e.target.value)}
            options={FONTS.map((f) => ({ value: f, label: f }))}
            placeholder={null}
          />
          <ColorField label="Color principal" value={draft.primary_color} onChange={set('primary_color')} />
          <ColorField label="Color secundario" value={draft.secondary_color} onChange={set('secondary_color')} />
          <Select
            label="Orientacion"
            value={draft.orientation}
            onChange={(e) => set('orientation')(e.target.value as Orientation)}
            options={ORIENTATION_OPTIONS}
            placeholder={null}
          />
          <Select
            label="Tamaño de pagina"
            value={draft.page_size}
            onChange={(e) => set('page_size')(e.target.value as PageSize)}
            options={PAGE_OPTIONS}
            placeholder={null}
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <span className="field__label">Logo</span>
            <div className="row">
              <StoredImage path={course.logo_path} alt="Logo del curso" fallback={<span className="muted">Sin logo</span>} />
              <FileButton onSelect={(file) => uploadLogo.mutate(file)} loading={uploadLogo.isPending}>
                {course.logo_path ? 'Cambiar logo' : 'Subir logo'}
              </FileButton>
              {course.logo_path && (
                <Button size="sm" variant="ghost" onClick={() => deleteLogo.mutate()}>
                  Quitar
                </Button>
              )}
            </div>
          </div>
          <div className="field">
            <span className="field__label">Firma del instructor</span>
            <div className="row">
              <StoredImage path={course.signature_path} alt="Firma del instructor" fallback={<span className="muted">Sin firma</span>} />
              <FileButton onSelect={(file) => uploadSignature.mutate(file)} loading={uploadSignature.isPending}>
                {course.signature_path ? 'Cambiar firma' : 'Subir firma'}
              </FileButton>
              {course.signature_path && (
                <Button size="sm" variant="ghost" onClick={() => deleteSignature.mutate()}>
                  Quitar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <CollaboratorsCard course={course} />

      <div className="card stack">
        <div className="row-between">
          <h2>Plantilla del certificado</h2>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <Select
              value={baseTemplateId}
              onChange={(e) => setBaseTemplateId(e.target.value)}
              options={(templates.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
              placeholder="Plantilla base..."
              aria-label="Plantilla base"
            />
            <Button variant="secondary" disabled={!baseTemplateId} onClick={() => setConfirmingTemplate(true)}>
              Cargar
            </Button>
            <Button variant="ghost" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
            </Button>
          </div>
        </div>
        <div className={`editor${showPreview ? ' editor--split' : ''}`}>
          <Textarea
            className="control--code"
            spellCheck={false}
            value={draft.certificate_html}
            onChange={(e) => set('certificate_html')(e.target.value)}
            error={draft.certificate_html.trim() ? undefined : 'El HTML no puede estar vacio'}
            aria-label="HTML del certificado"
          />
          {showPreview &&
            (preview.error ? (
              <Alert type="error">{errorMessage(preview.error, 'No se pudo generar la vista previa.')}</Alert>
            ) : (
              <CertificatePreview
                html={preview.data?.html}
                orientation={draft.orientation}
                pageSize={draft.page_size}
                loading={preview.isFetching}
                toolbar={
                  <Button size="sm" variant="secondary" onClick={openPdf} loading={openingPdf}>
                    Ver como PDF
                  </Button>
                }
              />
            ))}
        </div>
        <p className="field__hint">
          La vista previa usa los datos reales del curso con un participante de ejemplo e incluye los cambios sin guardar.
          Variables:{' '}
          {TEMPLATE_VARIABLES.map((v) => (
            <code key={v}>{`{{${v}}} `}</code>
          ))}
        </p>
      </div>

      <ConfirmDialog
        open={confirmingTemplate}
        onClose={() => setConfirmingTemplate(false)}
        onConfirm={() => applyTemplate.mutate(Number(baseTemplateId))}
        loading={applyTemplate.isPending}
        title="Cargar plantilla base"
        confirmLabel="Cargar"
        variant="primary"
      >
        <p>
          Se reemplazara el HTML, la orientacion y el tamaño de este curso por una copia de la plantilla base. Logo, colores,
          organizacion y firmas se conservan.
        </p>
        {dirty && <p className="small text-danger">Los cambios sin guardar del HTML se perderan.</p>}
      </ConfirmDialog>
    </div>
  );
};
