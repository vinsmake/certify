// 28.11 - Gestion de usuarios: crear, editar, asignar dependencia, desactivar

import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/userService';
import dependencyService from '../../services/dependencyService';
import UserForm from '../../components/admin/UserForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const UsersPage = () => {
  const [users,        setUsers]        = useState([]);
  const [deps,         setDeps]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editUser,     setEditUser]     = useState(null);
  const [deactUser,    setDeactUser]    = useState(null);
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState('');
  const [deactLoading, setDeactLoading] = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    userService.getAll()
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    dependencyService.getAll().then((d) => setDeps(Array.isArray(d) ? d : [])).catch(() => {});
  }, [load]);

  const handleCreate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await userService.create(data);
      setShowForm(false);
      setSuccessMsg('Usuario creado correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear el usuario.');
    } finally { setFormLoading(false); }
  };

  const handleEdit = (user) => { setEditUser(user); setFormError(''); };
  const handleUpdate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await userService.update(editUser.id, data);
      setEditUser(null);
      setSuccessMsg('Usuario actualizado correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al actualizar el usuario.');
    } finally { setFormLoading(false); }
  };

  const handleDeactConfirm = async () => {
    setDeactLoading(true);
    try {
      await userService.deactivate(deactUser.id);
      setDeactUser(null);
      setSuccessMsg('Usuario desactivado.');
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al desactivar el usuario.');
      setDeactUser(null);
    } finally { setDeactLoading(false); }
  };

  const columns = [
    { key: 'full_name',      label: 'Nombre' },
    { key: 'email',          label: 'Email' },
    { key: 'role',           label: 'Rol',          render: (v) => <Badge status={v} /> },
    { key: 'dependency_name',label: 'Dependencia',  render: (v) => v || '—' },
    { key: 'is_active',      label: 'Estado',       render: (v) => <Badge status={v ? 'active' : 'inactive'} /> },
    { key: 'created_at',     label: 'Creado',       render: (v) => formatDate(v) },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>Editar</Button>
          {row.is_active && (
            <Button size="sm" variant="danger" onClick={() => setDeactUser(row)}>Desactivar</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Usuarios</h1>
        <Button onClick={() => { setShowForm(true); setFormError(''); }}>+ Nuevo Usuario</Button>
      </div>

      {successMsg && <Alert type="success" message={successMsg} dismissible style={{ marginBottom: '1rem' }} />}
      {errorMsg   && <Alert type="error"   message={errorMsg}   dismissible style={{ marginBottom: '1rem' }} />}

      <Table columns={columns} data={users} loading={loading} emptyText="No hay usuarios registrados." />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Usuario" size="md">
        <UserForm dependencies={deps} onSubmit={handleCreate} onCancel={() => setShowForm(false)}
          loading={formLoading} error={formError} />
      </Modal>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuario" size="md">
        {editUser && (
          <UserForm initial={editUser} dependencies={deps} onSubmit={handleUpdate}
            onCancel={() => setEditUser(null)} loading={formLoading} error={formError} />
        )}
      </Modal>

      <Modal
        isOpen={!!deactUser} onClose={() => setDeactUser(null)} title="Desactivar Usuario"
        footer={<>
          <Button variant="secondary" onClick={() => setDeactUser(null)} disabled={deactLoading}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeactConfirm} loading={deactLoading}>Desactivar</Button>
        </>}
      >
        <p>Estas a punto de desactivar al usuario <strong>{deactUser?.full_name}</strong> ({deactUser?.email}). No podra iniciar sesion.</p>
      </Modal>
    </div>
  );
};

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:  { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
};

export default UsersPage;
