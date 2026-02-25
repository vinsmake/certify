// 24.02 / 24.04 / 24.07-24.09 / 24.12 - Pagina de participantes con CRUD, busqueda y detalle

import React, { useState, useEffect, useCallback } from 'react';
import participantService from '../services/participantService';
import dependencyService from '../services/dependencyService';
import useAuth from '../hooks/useAuth';
import ParticipantList from '../components/participants/ParticipantList';
import ParticipantForm from '../components/participants/ParticipantForm';
import ParticipantDetail from '../components/participants/ParticipantDetail';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const ParticipantsPage = () => {
  const { user } = useAuth();

  // Lista
  const [participants,  setParticipants]  = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const LIMIT = 20;

  // Dependencias (solo necesarias para admin al crear/editar)
  const [deps, setDeps] = useState([]);

  // 24.04 - Busqueda
  const [search, setSearch] = useState('');

  // Modales
  const [showForm,    setShowForm]    = useState(false);
  const [editPart,    setEditPart]    = useState(null);
  const [viewPart,    setViewPart]    = useState(null);
  const [deletePart,  setDeletePart]  = useState(null);

  // Estado del form/delete
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      dependencyService.getActive().then((data) => setDeps(data || [])).catch(() => {});
    }
  }, [user?.role]);

  const loadParticipants = useCallback(() => {
    setLoading(true);
    participantService.getParticipants({ page, limit: LIMIT, search: search || undefined })
      .then((data) => { setParticipants(data.data || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { loadParticipants(); }, [loadParticipants]);

  const handleSearch = (val) => { setSearch(val); setPage(1); };

  // 24.12 - Abrir detalle
  const handleView = (participant) => {
    setViewPart(participant);
  };

  // 24.07 - Crear
  const handleCreate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await participantService.createParticipant(data);
      setShowForm(false);
      setSuccessMsg('Participante creado correctamente.');
      loadParticipants();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear el participante.');
    } finally {
      setFormLoading(false);
    }
  };

  // 24.08 - Editar
  const handleEdit = (participant) => { setEditPart(participant); setFormError(''); };
  const handleUpdate = async (data) => {
    setFormLoading(true); setFormError('');
    try {
      await participantService.updateParticipant(editPart.id, data);
      setEditPart(null);
      setSuccessMsg('Participante actualizado correctamente.');
      loadParticipants();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al actualizar el participante.');
    } finally {
      setFormLoading(false);
    }
  };

  // 24.09 - Eliminar
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await participantService.deleteParticipant(deletePart.id);
      setDeletePart(null);
      setSuccessMsg('Participante eliminado.');
      loadParticipants();
    } catch (err) {
      setDeletePart(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Participantes</h1>
        <Button onClick={() => { setShowForm(true); setFormError(''); }}>
          + Nuevo Participante
        </Button>
      </div>

      {successMsg && (
        <Alert type="success" message={successMsg} dismissible
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* 24.04 - Busqueda */}
      <div style={styles.filters}>
        <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre..." />
      </div>

      <ParticipantList
        participants={participants}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeletePart}
      />

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      {/* Modal: Nuevo participante */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nuevo Participante"
        size="md"
      >
        <ParticipantForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
          error={formError}
          dependencies={deps}
          userRole={user?.role}
        />
      </Modal>

      {/* Modal: Editar participante */}
      <Modal
        isOpen={!!editPart}
        onClose={() => setEditPart(null)}
        title="Editar Participante"
        size="md"
      >
        {editPart && (
          <ParticipantForm
            initial={editPart}
            onSubmit={handleUpdate}
            onCancel={() => setEditPart(null)}
            loading={formLoading}
            error={formError}
            dependencies={deps}
            userRole={user?.role}
          />
        )}
      </Modal>

      {/* Modal: Confirmar eliminacion */}
      <Modal
        isOpen={!!deletePart}
        onClose={() => setDeletePart(null)}
        title="Eliminar Participante"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletePart(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleteLoading}>
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          Estas a punto de eliminar a <strong>{deletePart?.full_name}</strong>.
          Esta accion no se puede deshacer.
        </p>
      </Modal>

      {/* Modal: Detalle del participante */}
      <Modal
        isOpen={!!viewPart}
        onClose={() => setViewPart(null)}
        title="Detalle del Participante"
        size="lg"
      >
        {viewPart && (
          <ParticipantDetail
            participant={viewPart}
            onClose={() => setViewPart(null)}
          />
        )}
      </Modal>
    </div>
  );
};

const styles = {
  topBar:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:   { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' },
};

export default ParticipantsPage;
