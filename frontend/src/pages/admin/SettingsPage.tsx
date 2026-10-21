// Configuracion del branding institucional (versionado: cada certificado guarda su version).
import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrandingSchema, type BrandingVersion, type CreateBrandingInput } from '@certify/shared';
import { brandingApi } from '../../api';
import { keys } from '../../api/keys';
import { useTemplates } from '../../api/queries';
import { useApiMutation } from '../../api/useApiMutation';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Field, Input, Select } from '../../components/ui/Field';
import { FileButton } from '../../components/ui/FileButton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StoredImage } from '../../components/ui/StoredImage';
import { Table } from '../../components/ui/Table';
import { formatDate } from '../../lib/format';
import { validate, type FieldErrors } from '../../lib/form';
import { previewTemplatePdf } from './TemplatesPage';

const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Helvetica', 'Verdana', 'Trebuchet MS', 'Roboto'];

const EMPTY: CreateBrandingInput = {
  version_label: '',
  organization_name: '',
  font_family: 'Arial',
  primary_color: '#61859D',
  secondary_color: '#EA8215',
};

const ColorField = ({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string | undefined }) => (
  <Field label={label} error={error}>
    {(id) => (
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <input type="color" className="control-color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <input id={id} className="control mono" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    )}
  </Field>
);

const BrandingForm = ({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: BrandingVersion | undefined;
  onSubmit: (data: CreateBrandingInput) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [form, setForm] = useState<CreateBrandingInput>(initial ?? EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const set = (field: keyof CreateBrandingInput) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(createBrandingSchema, form);
    if (!result.ok) return setErrors(result.errors);
    onSubmit(result.data);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="grid-2">
        <Input
          label="Etiqueta de version"
          required
          value={form.version_label}
          error={errors.version_label}
          onChange={(e) => set('version_label')(e.target.value)}
          placeholder="ej. v2 - Nuevo diseño"
        />
        <Input
          label="Nombre de la organizacion"
          required
          value={form.organization_name}
          error={errors.organization_name}
          onChange={(e) => set('organization_name')(e.target.value)}
        />
        <Select
          label="Fuente"
          value={form.font_family}
          onChange={(e) => set('font_family')(e.target.value)}
          options={FONTS.map((f) => ({ value: f, label: f }))}
          placeholder={null}
        />
        <div />
        <ColorField label="Color principal" value={form.primary_color} onChange={set('primary_color')} error={errors.primary_color} />
        <ColorField label="Color secundario" value={form.secondary_color} onChange={set('secondary_color')} error={errors.secondary_color} />
      </div>
      <div className="form__actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear version'}
        </Button>
      </div>
    </form>
  );
};

const SettingsPage = () => {
  const { data: versions, isPending } = useQuery({ queryKey: keys.branding.all, queryFn: brandingApi.versions });
  const templates = useTemplates();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BrandingVersion | null>(null);
  const [deleting, setDeleting] = useState<BrandingVersion | null>(null);
  const invalidate = [keys.branding.all, keys.admin.activity];
  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useApiMutation({
    mutationFn: (input: CreateBrandingInput) => (editing ? brandingApi.update(editing.id, input) : brandingApi.create(input)),
    invalidate,
    success: () => (editing ? 'Version actualizada.' : 'Version creada. Sube su logo y activala cuando este lista.'),
    onSuccess: closeForm,
  });
  const activate = useApiMutation({
    mutationFn: (v: BrandingVersion) => brandingApi.activate(v.id),
    invalidate,
    success: (_res, v) => `Version "${v.version_label}" activada.`,
  });
  const remove = useApiMutation({
    mutationFn: (v: BrandingVersion) => brandingApi.remove(v.id),
    invalidate,
    success: 'Version eliminada.',
    onSuccess: () => setDeleting(null),
  });
  const uploadLogo = useApiMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => brandingApi.uploadLogo(id, file),
    invalidate,
    success: 'Logo actualizado.',
  });

  const defaultTemplate = templates.data?.find((t) => t.is_default) ?? templates.data?.[0];

  return (
    <>
      <PageHeader
        title="Configuracion"
        subtitle="Branding institucional. Los certificados nuevos usan la version activa; los ya emitidos conservan la suya."
        actions={
          <>
            {defaultTemplate && (
              <Button variant="secondary" onClick={() => previewTemplatePdf(defaultTemplate.id)}>
                Vista previa
              </Button>
            )}
            <Button onClick={() => setCreating(true)}>Nueva version</Button>
          </>
        }
      />

      <Table
        rows={versions}
        loading={isPending}
        rowKey={(v) => v.id}
        empty="No hay versiones de branding."
        columns={[
          { key: 'logo', header: 'Logo', render: (v) => <StoredImage path={v.logo_path} alt="Logo" /> },
          { key: 'label', header: 'Version', render: (v) => v.version_label },
          { key: 'org', header: 'Organizacion', render: (v) => v.organization_name },
          {
            key: 'style',
            header: 'Estilo',
            render: (v) => (
              <span className="row">
                <span className="control-color" style={{ background: v.primary_color, width: 20, height: 20 }} title={v.primary_color} />
                <span className="control-color" style={{ background: v.secondary_color, width: 20, height: 20 }} title={v.secondary_color} />
                <span className="small">{v.font_family}</span>
              </span>
            ),
          },
          { key: 'created', header: 'Creada', render: (v) => formatDate(v.created_at) },
          { key: 'status', header: 'Estado', render: (v) => (v.is_active ? <Badge tone="success">Activa</Badge> : '—') },
          {
            key: 'actions',
            header: '',
            render: (v) => (
              <div className="table__actions">
                {!v.is_active && (
                  <Button size="sm" variant="secondary" onClick={() => activate.mutate(v)}>
                    Activar
                  </Button>
                )}
                <FileButton variant="ghost" onSelect={(file) => uploadLogo.mutate({ id: v.id, file })}>
                  Logo
                </FileButton>
                <Button size="sm" variant="ghost" onClick={() => setEditing(v)}>
                  Editar
                </Button>
                {!v.is_active && (
                  <Button size="sm" variant="danger" onClick={() => setDeleting(v)}>
                    Eliminar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal open={creating || !!editing} onClose={closeForm} title={editing ? 'Editar version' : 'Nueva version de branding'} size="lg">
        <BrandingForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onSubmit={(input) => save.mutate(input)}
          onCancel={closeForm}
          loading={save.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
        loading={remove.isPending}
        title="Eliminar version"
        confirmLabel="Eliminar"
      >
        <p>
          Se eliminara la version <strong>{deleting?.version_label}</strong>. No se puede eliminar si ya hay certificados
          emitidos con ella.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default SettingsPage;
