// 28.01 - CRUD de dependencias con gestion de logo

import React, { useState, useEffect, useCallback } from 'react';
import dependencyService from '../../services/dependencyService';
import DependencyList from '../../components/admin/DependencyList';
import DependencyForm from '../../components/admin/DependencyForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const DependenciesPage = () => {
  const [deps,         setDeps]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editDep,      setEditDep]      = useState(null);
  const [deactivateDep,setDeactivateDep]= useState(null);
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState('');
  const [deactLoading, setDeactLoading] = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    dependencyService.getAll()
      .then((data) => setDeps(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await dependencyService.create(data);
      setShowForm(false);
      setSuccessMsg('Dependencia creada correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear la dependencia.');
    } finally { setFormLoading(false); }
  };

  const handleEdit = (dep) => { setEditDep(dep); setFormError(''); };
  const handleUpdate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await dependencyService.update(editDep.id, data);
      setEditDep(null);
      setSuccessMsg('Dependencia actualizada correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al actualizar.');
    } finally { setFormLoading(false); }
  };

  const handleActivate = async (id) => {
    try {
      await dependencyService.update(id, { is_active: true });
      setSuccessMsg('Dependencia activada correctamente.');
      load();
    } catch {
      setErrorMsg('Error al activar la dependencia.');
    }
  };

  const handleDeactivateConfirm = async () => {
    setDeactLoading(true);
    try {
      await dependencyService.deactivate(deactivateDep.id);
      setDeactivateDep(null);
      setSuccessMsg('Dependencia desactivada.');
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al desactivar.');
      setDeactivateDep(null);
    } finally { setDeactLoading(false); }
  };

  const handleLogoUpload = async (id, file) => {
    try {
      await dependencyService.uploadLogo(id, file);
      setSuccessMsg('Logo actualizado correctamente.');
      load();
    } catch {
      setErrorMsg('Error al subir el logo.');
    }
  };

  const handleSignatureUpload = async (id, file) => {
    try {
      await dependencyService.uploadSignature(id, file);
      setSuccessMsg('Firma actualizada correctamente.');
      load();
    } catch {
      setErrorMsg('Error al subir la firma.');
    }
  };

  const handleSignatureDelete = async (id) => {
    try {
      await dependencyService.deleteSignature(id);
      setSuccessMsg('Firma eliminada correctamente.');
      load();
    } catch {
      setErrorMsg('Error al eliminar la firma.');
    }
  };

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Dependencias</h1>
        <Button onClick={() => { setShowForm(true); setFormError(''); }}>+ Nueva Dependencia</Button>
      </div>

      {successMsg && <Alert type="success" message={successMsg} dismissible style={{ marginBottom: '1rem' }} />}
      {errorMsg   && <Alert type="error"   message={errorMsg}   dismissible style={{ marginBottom: '1rem' }} />}

      <DependencyList
        dependencies={deps}
        loading={loading}
        onEdit={handleEdit}
        onDeactivate={setDeactivateDep}
        onActivate={handleActivate}
        onLogoUpload={handleLogoUpload}
        onSignatureUpload={handleSignatureUpload}
        onSignatureDelete={handleSignatureDelete}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Dependencia" size="md">
        <DependencyForm onSubmit={handleCreate} onCancel={() => setShowForm(false)}
          loading={formLoading} error={formError} />
      </Modal>

      <Modal isOpen={!!editDep} onClose={() => setEditDep(null)} title="Editar Dependencia" size="md">
        {editDep && (
          <DependencyForm initial={editDep} onSubmit={handleUpdate} onCancel={() => setEditDep(null)}
            loading={formLoading} error={formError} />
        )}
      </Modal>

      <Modal
        isOpen={!!deactivateDep}
        onClose={() => setDeactivateDep(null)}
        title="Desactivar Dependencia"
        footer={<>
          <Button variant="secondary" onClick={() => setDeactivateDep(null)} disabled={deactLoading}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeactivateConfirm} loading={deactLoading}>Desactivar</Button>
        </>}
      >
        <p>Estas a punto de desactivar la dependencia <strong>{deactivateDep?.name}</strong>. Los usuarios y cursos asociados se veran afectados.</p>
      </Modal>
    </div>
  );
};

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:  { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
};

export default DependenciesPage;
