// 28.04 - Gestion de plantillas de certificado

import React, { useState, useEffect, useCallback } from 'react';
import templateService from '../../services/templateService';
import api from '../../services/api';
import TemplateList from '../../components/admin/TemplateList';
import TemplateForm from '../../components/admin/TemplateForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const TemplatesPage = () => {
  const [templates,    setTemplates]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editTmpl,     setEditTmpl]     = useState(null);
  const [deactivateTmpl, setDeactivateTmpl] = useState(null);
  const [formLoading,  setFormLoading]  = useState(false);
  const [formError,    setFormError]    = useState('');
  const [deactLoading, setDeactLoading] = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');

  const load = useCallback(() => {
    setLoading(true);
    templateService.getTemplates()
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await api.post('/templates', data);
      setShowForm(false);
      setSuccessMsg('Plantilla creada correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear la plantilla.');
    } finally { setFormLoading(false); }
  };

  const handleEdit = async (tmpl) => {
    // Cargamos html_content completo antes de abrir el formulario
    try {
      const full = await templateService.getTemplate(tmpl.id);
      setEditTmpl(full);
    } catch { setEditTmpl(tmpl); }
    setFormError('');
  };

  const handleUpdate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await api.put(`/templates/${editTmpl.id}`, data);
      setEditTmpl(null);
      setSuccessMsg('Plantilla actualizada correctamente.');
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al actualizar.');
    } finally { setFormLoading(false); }
  };

  const handleDeactivateConfirm = async () => {
    setDeactLoading(true);
    try {
      await api.delete(`/templates/${deactivateTmpl.id}`);
      setDeactivateTmpl(null);
      setSuccessMsg('Plantilla desactivada.');
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al desactivar.');
      setDeactivateTmpl(null);
    } finally { setDeactLoading(false); }
  };

  const handleSetDefault = async (tmpl) => {
    try {
      await api.put(`/templates/${tmpl.id}/default`);
      setSuccessMsg(`Plantilla "${tmpl.name}" establecida como default.`);
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al establecer default.');
    }
  };

  const handlePreview = async (tmpl) => {
    try { await templateService.previewTemplate(tmpl.id); }
    catch { setErrorMsg('No se pudo generar el preview.'); }
  };

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Plantillas de Certificado</h1>
        <Button onClick={() => { setShowForm(true); setFormError(''); }}>+ Nueva Plantilla</Button>
      </div>

      {successMsg && <Alert type="success" message={successMsg} dismissible style={{ marginBottom: '1rem' }} />}
      {errorMsg   && <Alert type="error"   message={errorMsg}   dismissible style={{ marginBottom: '1rem' }} />}

      <TemplateList
        templates={templates} loading={loading}
        onEdit={handleEdit} onDeactivate={setDeactivateTmpl}
        onSetDefault={handleSetDefault} onPreview={handlePreview}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Plantilla" size="xl">
        <TemplateForm onSubmit={handleCreate} onCancel={() => setShowForm(false)}
          loading={formLoading} error={formError} />
      </Modal>

      <Modal isOpen={!!editTmpl} onClose={() => setEditTmpl(null)} title="Editar Plantilla" size="xl">
        {editTmpl && (
          <TemplateForm initial={editTmpl} onSubmit={handleUpdate} onCancel={() => setEditTmpl(null)}
            loading={formLoading} error={formError} />
        )}
      </Modal>

      <Modal
        isOpen={!!deactivateTmpl} onClose={() => setDeactivateTmpl(null)}
        title="Desactivar Plantilla"
        footer={<>
          <Button variant="secondary" onClick={() => setDeactivateTmpl(null)} disabled={deactLoading}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeactivateConfirm} loading={deactLoading}>Desactivar</Button>
        </>}
      >
        <p>Estas a punto de desactivar la plantilla <strong>{deactivateTmpl?.name}</strong>.</p>
      </Modal>
    </div>
  );
};

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:  { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
};

export default TemplatesPage;
