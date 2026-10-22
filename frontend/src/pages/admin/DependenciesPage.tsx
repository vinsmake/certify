// Dependencias: definen permisos (usuarios rol dependencia) y agrupan cursos y participantes.
// Su logo, firma y firmante en el certificado se configuran en cada curso (pestaña Diseño).
import { useState, type FormEvent } from 'react';
import { createDependencySchema, type CreateDependencyInput, type Dependency } from '@certify/shared';
import { dependencyApi } from '../../api';
import { keys } from '../../api/keys';
import { useDependencies } from '../../api/queries';
import { useApiMutation } from '../../api/useApiMutation';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { validate, type FieldErrors } from '../../lib/form';

const DependencyForm = ({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Dependency | undefined;
  onSubmit: (data: CreateDependencyInput) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [abbreviation, setAbbreviation] = useState(initial?.abbreviation ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(createDependencySchema, { name, abbreviation: abbreviation.trim() || null });
    if (!result.ok) return setErrors(result.errors);
    onSubmit(result.data);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <Input label="Nombre" required value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
      <Input label="Abreviatura" value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="Opcional" />
      <div className="form__actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear dependencia'}
        </Button>
      </div>
    </form>
  );
};

const DependenciesPage = () => {
  const { data, isPending } = useDependencies();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Dependency | null>(null);
  const [deactivating, setDeactivating] = useState<Dependency | null>(null);
  const invalidate = [keys.dependencies.all, keys.stats.all];
  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useApiMutation({
    mutationFn: (input: CreateDependencyInput) =>
      editing ? dependencyApi.update(editing.id, input) : dependencyApi.create(input),
    invalidate,
    success: () => (editing ? 'Dependencia actualizada.' : 'Dependencia creada.'),
    onSuccess: closeForm,
  });
  const setActive = useApiMutation({
    mutationFn: ({ dep, active }: { dep: Dependency; active: boolean }): Promise<unknown> =>
      active ? dependencyApi.update(dep.id, { is_active: true }) : dependencyApi.deactivate(dep.id),
    invalidate,
    success: (_res, { active }) => (active ? 'Dependencia activada.' : 'Dependencia desactivada.'),
    onSuccess: () => setDeactivating(null),
  });

  return (
    <>
      <PageHeader
        title="Dependencias"
        subtitle="Definen que ve cada usuario. El logo y la firma de una dependencia en el certificado se configuran en cada curso."
        actions={<Button onClick={() => setCreating(true)}>Nueva dependencia</Button>}
      />
      <Table
        rows={data}
        loading={isPending}
        rowKey={(d) => d.id}
        empty="No hay dependencias registradas."
        columns={[
          { key: 'name', header: 'Nombre', render: (d) => d.name },
          { key: 'abbr', header: 'Abreviatura', render: (d) => d.abbreviation ?? '—' },
          { key: 'status', header: 'Estado', render: (d) => <Badge status={d.is_active ? 'active' : 'inactive'} /> },
          {
            key: 'actions',
            header: '',
            render: (d) => (
              <div className="table__actions">
                <Button size="sm" variant="secondary" onClick={() => setEditing(d)}>
                  Editar
                </Button>
                {d.is_active ? (
                  <Button size="sm" variant="danger" onClick={() => setDeactivating(d)}>
                    Desactivar
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setActive.mutate({ dep: d, active: true })}>
                    Activar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal open={creating || !!editing} onClose={closeForm} title={editing ? 'Editar dependencia' : 'Nueva dependencia'}>
        <DependencyForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onSubmit={(input) => save.mutate(input)}
          onCancel={closeForm}
          loading={save.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => deactivating && setActive.mutate({ dep: deactivating, active: false })}
        loading={setActive.isPending}
        title="Desactivar dependencia"
        confirmLabel="Desactivar"
      >
        <p>
          Se desactivara <strong>{deactivating?.name}</strong>. Sus usuarios y cursos se veran afectados.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default DependenciesPage;
