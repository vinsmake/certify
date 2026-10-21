import { useState, type FormEvent } from 'react';
import { createTagSchema, type CreateTagInput, type Tag } from '@certify/shared';
import { tagApi } from '../../api';
import { keys } from '../../api/keys';
import { useTags } from '../../api/queries';
import { useApiMutation } from '../../api/useApiMutation';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Field';
import { FileButton } from '../../components/ui/FileButton';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StoredImage } from '../../components/ui/StoredImage';
import { Table } from '../../components/ui/Table';
import { validate, type FieldErrors } from '../../lib/form';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const TagForm = ({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Tag | undefined;
  onSubmit: (data: CreateTagInput) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(createTagSchema, { name, slug, description: description.trim() || null });
    if (!result.ok) return setErrors(result.errors);
    onSubmit(result.data);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Input
        label="Nombre"
        required
        value={name}
        error={errors.name}
        onChange={(e) => {
          setName(e.target.value);
          // El slug se sugiere solo al crear
          if (!initial) setSlug(slugify(e.target.value));
        }}
      />
      <Input label="Slug" required value={slug} error={errors.slug} onChange={(e) => setSlug(e.target.value)} />
      <Input label="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="form__actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear tag'}
        </Button>
      </div>
    </form>
  );
};

const TagsPage = () => {
  const { data, isPending } = useTags();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const invalidate = [keys.tags.all, keys.participants.all];
  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useApiMutation({
    mutationFn: (input: CreateTagInput) => (editing ? tagApi.update(editing.id, input) : tagApi.create(input)),
    invalidate,
    success: () => (editing ? 'Tag actualizado.' : 'Tag creado.'),
    onSuccess: closeForm,
  });
  const remove = useApiMutation({
    mutationFn: (tag: Tag) => tagApi.remove(tag.id),
    invalidate,
    success: 'Tag eliminado.',
    onSuccess: () => setDeleting(null),
  });
  const uploadLogo = useApiMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => tagApi.uploadLogo(id, file),
    invalidate,
    success: 'Logo actualizado.',
  });

  return (
    <>
      <PageHeader title="Tags" actions={<Button onClick={() => setCreating(true)}>Nuevo tag</Button>} />
      <Table
        rows={data}
        loading={isPending}
        rowKey={(t) => t.id}
        empty="No hay tags registrados."
        columns={[
          { key: 'logo', header: 'Logo', render: (t) => <StoredImage path={t.logo_path} alt={t.name} /> },
          { key: 'name', header: 'Nombre', render: (t) => t.name },
          { key: 'slug', header: 'Slug', render: (t) => <code>{t.slug}</code> },
          { key: 'description', header: 'Descripcion', render: (t) => t.description ?? '—' },
          {
            key: 'actions',
            header: '',
            render: (t) => (
              <div className="table__actions">
                <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
                  Editar
                </Button>
                <FileButton variant="ghost" onSelect={(file) => uploadLogo.mutate({ id: t.id, file })}>
                  Logo
                </FileButton>
                <Button size="sm" variant="danger" onClick={() => setDeleting(t)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal open={creating || !!editing} onClose={closeForm} title={editing ? 'Editar tag' : 'Nuevo tag'}>
        <TagForm
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
        title="Eliminar tag"
        confirmLabel="Eliminar"
      >
        <p>
          Se eliminara <strong>{deleting?.name}</strong> y se quitara de todos los participantes que lo tengan.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default TagsPage;
