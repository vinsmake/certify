import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createUserSchema, updateUserSchema, type CreateUserInput, type Role, type UpdateUserInput, type UserItem } from '@certify/shared';
import { userApi } from '../../api';
import { keys } from '../../api/keys';
import { useDependencies } from '../../api/queries';
import { useApiMutation } from '../../api/useApiMutation';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { formatDate } from '../../lib/format';
import { validate, type FieldErrors } from '../../lib/form';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'dependencia', label: 'Dependencia' },
];

type UserPayload = { create: true; data: CreateUserInput } | { create: false; data: UpdateUserInput };

const UserForm = ({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: UserItem | undefined;
  onSubmit: (payload: UserPayload) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const deps = useDependencies();
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? '',
    email: initial?.email ?? '',
    password: '',
    role: (initial?.role ?? 'dependencia') as Role,
    dependency_id: initial?.dependency_id ? String(initial.dependency_id) : '',
    is_active: initial?.is_active ?? true,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const set = (field: 'full_name' | 'email' | 'password' | 'dependency_id') => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const common = {
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      dependency_id: form.dependency_id ? Number(form.dependency_id) : null,
    };
    if (initial) {
      if (form.role === 'dependencia' && !form.dependency_id) {
        return setErrors({ dependency_id: 'La dependencia es requerida para este rol' });
      }
      const result = validate(updateUserSchema, { ...common, is_active: form.is_active });
      if (!result.ok) return setErrors(result.errors);
      onSubmit({ create: false, data: result.data });
    } else {
      const result = validate(createUserSchema, { ...common, password: form.password });
      if (!result.ok) return setErrors(result.errors);
      onSubmit({ create: true, data: result.data });
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="grid-2">
        <Input label="Nombre completo" required value={form.full_name} error={errors.full_name} onChange={set('full_name')} />
        <Input label="Email" type="email" required value={form.email} error={errors.email} onChange={set('email')} />
      </div>
      {!initial && (
        <Input
          label="Contraseña"
          type="password"
          required
          value={form.password}
          error={errors.password}
          onChange={set('password')}
          hint="Minimo 8 caracteres."
        />
      )}
      <div className="grid-2">
        <Select
          label="Rol"
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
          options={ROLE_OPTIONS}
          placeholder={null}
        />
        <Select
          label="Dependencia"
          value={form.dependency_id}
          error={errors.dependency_id}
          onChange={set('dependency_id')}
          options={(deps.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
          placeholder={form.role === 'admin' ? 'Sin dependencia (admin)' : 'Selecciona una dependencia'}
          disabled={form.role === 'admin'}
        />
      </div>
      {initial && (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
          />
          Usuario activo
        </label>
      )}
      <div className="form__actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
};

const UsersPage = () => {
  const { data, isPending } = useQuery({ queryKey: keys.users.all, queryFn: userApi.list });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [deactivating, setDeactivating] = useState<UserItem | null>(null);
  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const save = useApiMutation({
    mutationFn: (payload: UserPayload) =>
      payload.create ? userApi.create(payload.data) : userApi.update((editing as UserItem).id, payload.data),
    invalidate: [keys.users.all, keys.stats.all],
    success: (_res, payload) => (payload.create ? 'Usuario creado.' : 'Usuario actualizado.'),
    onSuccess: closeForm,
  });
  const deactivate = useApiMutation({
    mutationFn: (user: UserItem) => userApi.deactivate(user.id),
    invalidate: [keys.users.all, keys.stats.all],
    success: 'Usuario desactivado.',
    onSuccess: () => setDeactivating(null),
  });

  return (
    <>
      <PageHeader title="Usuarios" actions={<Button onClick={() => setCreating(true)}>Nuevo usuario</Button>} />
      <Table
        rows={data}
        loading={isPending}
        rowKey={(u) => u.id}
        empty="No hay usuarios registrados."
        columns={[
          { key: 'name', header: 'Nombre', render: (u) => u.full_name },
          { key: 'email', header: 'Email', render: (u) => u.email },
          { key: 'role', header: 'Rol', render: (u) => <Badge status={u.role} /> },
          { key: 'dependency', header: 'Dependencia', render: (u) => u.dependency_name ?? '—' },
          { key: 'status', header: 'Estado', render: (u) => <Badge status={u.is_active ? 'active' : 'inactive'} /> },
          { key: 'created', header: 'Creado', render: (u) => formatDate(u.created_at) },
          {
            key: 'actions',
            header: '',
            render: (u) => (
              <div className="table__actions">
                <Button size="sm" variant="secondary" onClick={() => setEditing(u)}>
                  Editar
                </Button>
                {u.is_active && (
                  <Button size="sm" variant="danger" onClick={() => setDeactivating(u)}>
                    Desactivar
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal open={creating || !!editing} onClose={closeForm} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <UserForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onSubmit={(payload) => save.mutate(payload)}
          onCancel={closeForm}
          loading={save.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => deactivating && deactivate.mutate(deactivating)}
        loading={deactivate.isPending}
        title="Desactivar usuario"
        confirmLabel="Desactivar"
      >
        <p>
          <strong>{deactivating?.full_name}</strong> ({deactivating?.email}) ya no podra iniciar sesion.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default UsersPage;
