// 23.02 / 23.04 / 23.07-23.09 / 23.16 - Pagina de cursos con CRUD, filtros y detalle

import React, { useState, useEffect, useCallback } from 'react';
import courseService from '../services/courseService';
import api from '../services/api';
import CourseList from '../components/courses/CourseList';
import CourseForm from '../components/courses/CourseForm';
import CourseDetail from '../components/courses/CourseDetail';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Alert from '../components/ui/Alert';
import useAuth from '../hooks/useAuth';

const TYPE_OPTIONS = [
  { value: 'curso',    label: 'Curso'      },
  { value: 'taller',   label: 'Taller'     },
  { value: 'charla',   label: 'Charla'     },
  { value: 'seminario',label: 'Seminario'  },
  { value: 'diploma',  label: 'Diploma'    },
];

const CoursesPage = () => {
  const { user } = useAuth();

  // Lista
  const [courses,   setCourses]   = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const LIMIT = 20;

  // 23.16 - Filtros
  const [search,    setSearch]    = useState('');
  const [typeFilter,setTypeFilter]= useState('');

  // Dependencias y participantes (para CourseDetail)
  const [allDeps,   setAllDeps]   = useState([]);
  const [allParts,  setAllParts]  = useState([]);

  // Modales
  const [showForm,   setShowForm]   = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [viewDeps,   setViewDeps]   = useState([]);
  const [deleteCourse, setDeleteCourse] = useState(null);

  // Estado del form/delete
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');

  const loadCourses = useCallback(() => {
    setLoading(true);
    courseService.getCourses({ page, limit: LIMIT, search: search || undefined, type: typeFilter || undefined })
      .then((data) => { setCourses(data.data || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, typeFilter]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  // Cargar datos auxiliares para CourseDetail
  useEffect(() => {
    api.get('/dependencies', { params: { limit: 100 } }).then((r) => {
      const deps = r.data;
      setAllDeps(Array.isArray(deps) ? deps : deps.data || []);
    }).catch(() => {});
    api.get('/participants',  { params: { limit: 100 } }).then((r) => setAllParts(r.data.data || [])).catch(() => {});
  }, []);

  const handleSearch = (val) => { setSearch(val); setPage(1); };
  const handleType   = (e)   => { setTypeFilter(e.target.value); setPage(1); };

  // Abrir detalle
  const handleView = (course) => {
    courseService.getCourse(course.id).then((full) => {
      setViewCourse(full);
      setViewDeps(full.dependencies || []);
    }).catch(() => {});
  };

  const handleRefreshDetail = () => {
    if (!viewCourse) return;
    courseService.getCourse(viewCourse.id).then((full) => {
      setViewCourse(full);
      setViewDeps(full.dependencies || []);
    }).catch(() => {});
    loadCourses();
  };

  // 23.07 - Crear
  const handleCreate = async (data, { signatureFile } = {}) => {
    setFormLoading(true); setFormError('');
    try {
      const created = await courseService.createCourse(data);
      if (signatureFile) {
        await courseService.uploadSignature(created.id, signatureFile);
      }
      setShowForm(false);
      setSuccessMsg('Curso creado correctamente.');
      loadCourses();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear el curso.');
    } finally {
      setFormLoading(false);
    }
  };

  // 23.08 - Editar
  const handleEdit = (course) => { setEditCourse(course); setFormError(''); };
  const handleUpdate = async (data, { signatureFile, signatureRemoved } = {}) => {
    setFormLoading(true); setFormError('');
    try {
      await courseService.updateCourse(editCourse.id, data);
      if (signatureFile) {
        await courseService.uploadSignature(editCourse.id, signatureFile);
      } else if (signatureRemoved) {
        await courseService.deleteSignature(editCourse.id);
      }
      setEditCourse(null);
      setSuccessMsg('Curso actualizado correctamente.');
      loadCourses();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al actualizar el curso.');
    } finally {
      setFormLoading(false);
    }
  };

  // 23.09 - Eliminar
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await courseService.deleteCourse(deleteCourse.id);
      setDeleteCourse(null);
      setSuccessMsg('Curso eliminado.');
      loadCourses();
    } catch (err) {
      setDeleteCourse(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.topBar}>
        <h1 style={styles.title}>Cursos</h1>
        <Button onClick={() => { setShowForm(true); setFormError(''); }}>
          + Nuevo Curso
        </Button>
      </div>

      {successMsg && (
        <Alert type="success" message={successMsg} dismissible
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* 23.16 - Filtros */}
      <div style={styles.filters}>
        <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre..." />
        <Select
          value={typeFilter}
          onChange={handleType}
          options={TYPE_OPTIONS}
          placeholder="Todos los tipos"
          style={{ width: '180px', marginBottom: 0 }}
        />
      </div>

      <CourseList
        courses={courses}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={setDeleteCourse}
      />

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      {/* Modal: Nuevo curso */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Nuevo Curso"
        size="lg"
      >
        <CourseForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
          error={formError}
          dependencies={allDeps}
          userRole={user?.role}
        />
      </Modal>

      {/* Modal: Editar curso */}
      <Modal
        isOpen={!!editCourse}
        onClose={() => setEditCourse(null)}
        title="Editar Curso"
        size="lg"
      >
        {editCourse && (
          <CourseForm
            initial={editCourse}
            onSubmit={handleUpdate}
            onCancel={() => setEditCourse(null)}
            loading={formLoading}
            error={formError}
            dependencies={allDeps}
            userRole={user?.role}
          />
        )}
      </Modal>

      {/* Modal: Confirmar eliminacion */}
      <Modal
        isOpen={!!deleteCourse}
        onClose={() => setDeleteCourse(null)}
        title="Eliminar Curso"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteCourse(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleteLoading}>
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          Estas a punto de eliminar el curso <strong>{deleteCourse?.name}</strong>.
          Esta accion no se puede deshacer.
        </p>
      </Modal>

      {/* Modal: Detalle del curso */}
      <Modal
        isOpen={!!viewCourse}
        onClose={() => setViewCourse(null)}
        title="Detalle del Curso"
        size="lg"
      >
        {viewCourse && (
          <CourseDetail
            course={viewCourse}
            dependencies={viewDeps}
            allDependencies={allDeps}
            allParticipants={allParts}
            onClose={() => setViewCourse(null)}
            onRefresh={handleRefreshDetail}
            userRole={user?.role}
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

export default CoursesPage;
