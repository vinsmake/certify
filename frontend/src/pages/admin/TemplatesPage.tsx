import { useState, type FormEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  createTemplateSchema,
  type CreateTemplateInput,
  type Orientation,
  type PageSize,
  type Template,
  type TemplateSummary,
} from '@certify/shared';
import { templateApi } from '../../api';
import { keys } from '../../api/keys';
import { useTemplates } from '../../api/queries';
import { useApiMutation } from '../../api/useApiMutation';
import { CertificatePreview } from '../../components/templates/CertificatePreview';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';
import { Table } from '../../components/ui/Table';
import { openBlob } from '../../lib/files';
import { validate, type FieldErrors } from '../../lib/form';
import { toast } from '../../lib/toast';
import { useDebounced } from '../../lib/useDebounced';

const ORIENTATION_OPTIONS = [
  { value: 'landscape', label: 'Horizontal' },
  { value: 'portrait', label: 'Vertical' },
];
const PAGE_OPTIONS = [
  { value: 'letter', label: 'Carta' },
  { value: 'A4', label: 'A4' },
];

// Variables que el backend sustituye en las plantillas (ver backend/src/rendering/certificate-html.ts)
const VARIABLES = [
  'participant_name',
  'course_name',
  'course_type',
  'course_duration',
  'instructor',
  'certificate_noun',
  'course_label',
  'issue_date',
  'certificate_uuid',
  'verification_url',
  'qr_code_base64',
  'institutional_logo_base64',
  'dependency_logos_html',
  'dependency_signatures_html',
  'instructor_signature_html',
  'dependency_names',
  'primary_color',
  'secondary_color',
  'font_family',
  'organization_name',
];

export const previewTemplatePdf = (id: number) =>
  templateApi
    .previewPdf(id)
    .then((pdf) => openBlob(pdf))
    .catch(() => toast.error('No se pudo generar la vista previa.'));

const TemplateForm = ({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Template | undefined;
  onSubmit: (data: CreateTemplateInput) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    html_content: initial?.html_content ?? '',
    orientation: (initial?.orientation ?? 'landscape') as Orientation,
    page_size: (initial?.page_size ?? 'letter') as PageSize,
  });
  const [showPreview, setShowPreview] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Preview en vivo: el backend sustituye las variables con datos de ejemplo
  const html = useDebounced(form.html_content, 500);
  const preview = useQuery({
    queryKey: ['templates', 'render', html],
    queryFn: () => templateApi.renderSample(html),
    enabled: showPreview && html.trim() !== '',
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(createTemplateSchema, { ...form, description: form.description.trim() || null });
    if (!result.ok) return setErrors(result.errors);
    onSubmit(result.data);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="grid-2">
        <Input label="Nombre" required value={form.name} error={errors.name} onChange={set('name')} />
        <Input label="Slug" required value={form.slug} error={errors.slug} onChange={set('slug')} />
        <Select label="Orientacion" value={form.orientation} onChange={set('orientation')} options={ORIENTATION_OPTIONS} placeholder={null} />
        <Select label="Tamaño de pagina" value={form.page_size} onChange={set('page_size')} options={PAGE_OPTIONS} placeholder={null} />
      </div>
      <Input label="Descripcion" value={form.description} onChange={set('description')} />

      <div className="row-between">
        <span className="field__label">Contenido HTML/CSS</span>
        <Button size="sm" variant="secondary" onClick={() => setShowPreview((v) => !v)}>
          {showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
        </Button>
      </div>
      <div className={`editor${showPreview ? ' editor--split' : ''}`}>
        <Textarea
          className="control--code"
          spellCheck={false}
          value={form.html_content}
          error={errors.html_content}
          onChange={set('html_content')}
          placeholder="<!DOCTYPE html>..."
        />
        {showPreview && (
          <CertificatePreview
            html={preview.data?.html}
            orientation={form.orientation}
            pageSize={form.page_size}
            loading={preview.isFetching}
          />
        )}
      </div>
      <p className="field__hint">
        Variables disponibles:{' '}
        {VARIABLES.map((v) => (
          <code key={v}>{`{{${v}}} `}</code>
        ))}
      </p>

      <div className="form__actions">
        {initial && (
          <Button variant="ghost" onClick={() => previewTemplatePdf(initial.id)}>
            PDF de la version guardada
          </Button>
        )}
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear plantilla'}
        </Button>
      </div>
    </form>
  );
};

const TemplatesPage = () => {
  const { data, isPending } = useTemplates();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deactivating, setDeactivating] = useState<TemplateSummary | null>(null);
  // La lista no trae html_content: se carga la plantilla completa al editar
  const editing = useQuery({
    queryKey: keys.templates.detail(editingId ?? 0),
    queryFn: () => templateApi.get(editingId as number),
    enabled: editingId !== null,
  });
  const closeForm = () => {
    setCreating(false);
    setEditingId(null);
  };
  const invalidate = [keys.templates.all, keys.courses.all];

  const save = useApiMutation({
    mutationFn: (input: CreateTemplateInput) =>
      editingId ? templateApi.update(editingId, input) : templateApi.create(input),
    invalidate,
    success: () => (editingId ? 'Plantilla actualizada.' : 'Plantilla creada.'),
    onSuccess: closeForm,
  });
  const setDefault = useApiMutation({
    mutationFn: (t: TemplateSummary) => templateApi.setDefault(t.id),
    invalidate,
    success: (_res, t) => `"${t.name}" es ahora la plantilla por defecto.`,
  });
  const deactivate = useApiMutation({
    mutationFn: (t: TemplateSummary) => templateApi.deactivate(t.id),
    invalidate,
    success: 'Plantilla desactivada.',
    onSuccess: () => setDeactivating(null),
  });

  const formOpen = creating || editingId !== null;

  return (
    <>
      <PageHeader title="Plantillas de certificado" actions={<Button onClick={() => setCreating(true)}>Nueva plantilla</Button>} />
      <Table
        rows={data}
        loading={isPending}
        rowKey={(t) => t.id}
        empty="No hay plantillas registradas."
        columns={[
          { key: 'name', header: 'Nombre', render: (t) => t.name },
          { key: 'slug', header: 'Slug', render: (t) => <code>{t.slug}</code> },
          { key: 'format', header: 'Formato', render: (t) => `${t.page_size === 'A4' ? 'A4' : 'Carta'} ${t.orientation === 'portrait' ? 'vertical' : 'horizontal'}` },
          { key: 'default', header: 'Por defecto', render: (t) => (t.is_default ? <Badge tone="success">Si</Badge> : '—') },
          {
            key: 'actions',
            header: '',
            render: (t) => (
              <div className="table__actions">
                <Button size="sm" variant="secondary" onClick={() => setEditingId(t.id)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => previewTemplatePdf(t.id)}>
                  PDF
                </Button>
                {!t.is_default && (
                  <Button size="sm" variant="ghost" onClick={() => setDefault.mutate(t)}>
                    Usar por defecto
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => setDeactivating(t)}>
                  Desactivar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={formOpen} onClose={closeForm} title={editingId ? 'Editar plantilla' : 'Nueva plantilla'} size="xl">
        {editingId !== null && editing.data?.id !== editingId ? (
          <Spinner />
        ) : (
          <TemplateForm
            key={editingId ?? 'new'}
            initial={editingId !== null ? editing.data : undefined}
            onSubmit={(input) => save.mutate(input)}
            onCancel={closeForm}
            loading={save.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => deactivating && deactivate.mutate(deactivating)}
        loading={deactivate.isPending}
        title="Desactivar plantilla"
        confirmLabel="Desactivar"
      >
        <p>
          <strong>{deactivating?.name}</strong> dejara de estar disponible. Los cursos que la usan pasaran a la plantilla por
          defecto.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default TemplatesPage;
