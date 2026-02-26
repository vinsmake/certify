// 24.02 / 24.04 / 24.07-24.09 / 24.12 - Pagina de participantes con CRUD, busqueda y detalle

import React, { useState, useEffect, useCallback } from 'react';
import participantService from '../services/participantService';
import dependencyService from '../services/dependencyService';
import courseService from '../services/courseService';
import tagService from '../services/tagService';
import useAuth from '../hooks/useAuth';
import ParticipantList from '../components/participants/ParticipantList';
import ParticipantForm from '../components/participants/ParticipantForm';
import ParticipantDetail from '../components/participants/ParticipantDetail';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Select from '../components/ui/Select';

const ParticipantsPage = () => {
  const { user } = useAuth();

  // Lista
  const [participants,  setParticipants]  = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const LIMIT = 20;

  // Dependencias, cursos y tags para formularios y filtros
  const [deps,    setDeps]    = useState([]);
  const [courses, setCourses] = useState([]);
  const [tags,    setTags]    = useState([]);

  // 24.04 - Busqueda y filtros acumulativos
  const [search,       setSearch]       = useState('');
  const [filterDep,    setFilterDep]    = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTag,    setFilterTag]    = useState('');

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
    // Cargar datos para filtros y formularios
    if (user?.role === 'admin') {
      dependencyService.getActive().then((data) => setDeps(data || [])).catch(() => {});
    }
    courseService.getCourses({ limit: 200 })
      .then((data) => setCourses(data.data || data || []))
      .catch(() => {});
    tagService.getAll()
      .then((data) => setTags(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user?.role]);

  const loadParticipants = useCallback(() => {
    setLoading(true);
    participantService.getParticipants({
      page,
      limit: LIMIT,
      search:    search    || undefined,
      course_id: filterCourse || undefined,
      tag_id:    filterTag    || undefined,
      // El filtro de dependencia solo aplica para admin (el backend lo maneja via dependencyFilter para otros roles)
      ...(user?.role === 'admin' && filterDep ? { dependency_id: filterDep } : {}),
    })
      .then((data) => { setParticipants(data.data || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterDep, filterCourse, filterTag, user?.role]);

  useEffect(() => { loadParticipants(); }, [loadParticipants]);

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleFilterDep    = (e) => { setFilterDep(e.target.value);    setPage(1); };
  const handleFilterCourse = (e) => { setFilterCourse(e.target.value); setPage(1); };
  const handleFilterTag    = (e) => { setFilterTag(e.target.value);    setPage(1); };

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

      {/* 24.04 - Busqueda y filtros acumulativos */}
      <div style={styles.filters}>
        <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre..." />

        {user?.role === 'admin' && (
          <Select
            value={filterDep}
            onChange={handleFilterDep}
            options={(deps || []).map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Todas las dependencias"
            style={styles.filterSelect}
          />
        )}

        <Select
          value={filterCourse}
          onChange={handleFilterCourse}
          options={(courses || []).map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Todos los cursos"
          style={styles.filterSelect}
        />

        <Select
          value={filterTag}
          onChange={handleFilterTag}
          options={(tags || []).map((t) => ({ value: t.id, label: t.name }))}
          placeholder="Todos los tags"
          style={styles.filterSelect}
        />

        {(filterDep || filterCourse || filterTag) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterDep(''); setFilterCourse(''); setFilterTag(''); setPage(1); }}
          >
            Limpiar filtros
          </Button>
        )}
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
          tags={tags}
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
            tags={tags}
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
  topBar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  title:        { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)' },
  filters:      { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' },
  filterSelect: { minWidth: '180px' },
};

export default ParticipantsPage;
