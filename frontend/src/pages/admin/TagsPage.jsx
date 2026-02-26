import React, { useState, useEffect, useCallback } from 'react';
import tagService from '../../services/tagService';
import TagList from '../../components/admin/TagList';
import TagForm from '../../components/admin/TagForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const TagsPage = () => {
  const [tags,       setTags]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editTag,    setEditTag]    = useState(null);
  const [deleteTag,  setDeleteTag]  = useState(null);
  const [formLoading,setFormLoading]= useState(false);
  const [formError,  setFormError]  = useState('');
  const [delLoading, setDelLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    tagService.getAll()
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await tagService.create(data);
      setShowForm(false);
      setSuccessMsg('Tag creado correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear el tag.');
    } finally { setFormLoading(false); }
  };

  const handleEdit = (tag) => { setEditTag(tag); setFormError(''); };
  const handleUpdate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await tagService.update(editTag.id, data);
      setEditTag(null);
      setSuccessMsg('Tag actualizado correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al actualizar el tag.');
    } finally { setFormLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    setDelLoading(true);
    try {
      await tagService.delete(deleteTag.id);
      setDeleteTag(null);
      setSuccessMsg('Tag eliminado correctamente.');
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al eliminar el tag.');
      setDeleteTag(null);
    } finally { setDelLoading(false); }
  };

  const handleLogoUpload = async (id, file) => {
    try {
      await tagService.uploadLogo(id, file);
      setSuccessMsg('Logo actualizado correctamente.');
      load();
    } catch {
      setErrorMsg('Error al subir el logo.');
    }
  };

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Tags</h1>
        <Button onClick={() => { setShowForm(true); setFormError(''); }}>+ Nuevo Tag</Button>
      </div>

      {successMsg && <Alert type="success" message={successMsg} dismissible style={{ marginBottom: '1rem' }} />}
      {errorMsg   && <Alert type="error"   message={errorMsg}   dismissible style={{ marginBottom: '1rem' }} />}

      <TagList
        tags={tags}
        loading={loading}
        onEdit={handleEdit}
        onDelete={setDeleteTag}
        onLogoUpload={handleLogoUpload}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nuevo Tag" size="md">
        <TagForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
          error={formError}
        />
      </Modal>

      <Modal isOpen={!!editTag} onClose={() => setEditTag(null)} title="Editar Tag" size="md">
        {editTag && (
          <TagForm
            initial={editTag}
            onSubmit={handleUpdate}
            onCancel={() => setEditTag(null)}
            loading={formLoading}
            error={formError}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!deleteTag}
        onClose={() => setDeleteTag(null)}
        title="Eliminar Tag"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTag(null)} disabled={delLoading}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={delLoading}>
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          Estas a punto de eliminar el tag <strong>{deleteTag?.name}</strong>.
          Se eliminara tambien de todos los participantes que lo tengan asignado.
          Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
};

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:  { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
};

export default TagsPage;
