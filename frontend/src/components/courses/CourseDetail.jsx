// 23.10-23.15 - Vista detallada de un curso: dependencias + participantes + acciones

import React, { useState, useEffect } from 'react';
import courseService from '../../services/courseService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Alert from '../ui/Alert';

const STATUS_OPTIONS = [
  { value: 'enrolled',  label: 'Inscrito'    },
  { value: 'attended',  label: 'Asistio'     },
  { value: 'completed', label: 'Completado'  },
  { value: 'absent',    label: 'Ausente'     },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const CourseDetail = ({ course, dependencies, allDependencies, allParticipants, onClose, onRefresh }) => {
  const [participants, setParticipants] = useState([]);
  const [loadingPart,  setLoadingPart]  = useState(true);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [statusError,  setStatusError]  = useState('');

  // Inscribir participante
  const [enrollId,  setEnrollId]  = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState('');

  // Dependencia colaboradora
  const [addDepId,   setAddDepId]   = useState('');
  const [addingDep,  setAddingDep]  = useState(false);
  const [depMsg,     setDepMsg]     = useState('');

  const loadParticipants = () => {
    setLoadingPart(true);
    courseService.getCourseParticipants(course.id)
      .then((data) => setParticipants(data.participants || []))
      .catch(() => {})
      .finally(() => setLoadingPart(false));
  };

  useEffect(() => { loadParticipants(); }, [course.id]); // eslint-disable-line

  // 23.15 - Cambiar estado de asistencia
  const handleStatusChange = async (participantId, newStatus) => {
    setStatusMsg(''); setStatusError('');
    try {
      await courseService.updateParticipantStatus(course.id, participantId, newStatus);
      setStatusMsg('Estado actualizado.');
      loadParticipants();
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Error al actualizar estado.');
    }
  };

  // 23.14 - Inscribir participante
  const handleEnroll = async () => {
    if (!enrollId) return;
    setEnrolling(true); setEnrollMsg('');
    try {
      const res = await courseService.enrollParticipants(course.id, [parseInt(enrollId)]);
      if (res.enrolled?.length) {
        setEnrollMsg('Participante inscrito correctamente.');
        setEnrollId('');
        loadParticipants();
      } else if (res.already_enrolled?.length) {
        setEnrollMsg('El participante ya estaba inscrito.');
      } else {
        setEnrollMsg('No se pudo inscribir al participante.');
      }
    } catch (err) {
      setEnrollMsg(err.response?.data?.error || 'Error al inscribir.');
    } finally {
      setEnrolling(false);
    }
  };

  // 23.12 - Asociar dependencia colaboradora
  const handleAddDep = async () => {
    if (!addDepId) return;
    setAddingDep(true); setDepMsg('');
    try {
      await courseService.addCourseDependency(course.id, parseInt(addDepId));
      setDepMsg('Dependencia agregada.');
      setAddDepId('');
      onRefresh();
    } catch (err) {
      setDepMsg(err.response?.data?.error || 'Error al agregar dependencia.');
    } finally {
      setAddingDep(false);
    }
  };

  // 23.12 - Desasociar dependencia colaboradora
  const handleRemoveDep = async (depId) => {
    try {
      await courseService.removeCourseDependency(course.id, depId);
      setDepMsg('Dependencia removida.');
      onRefresh();
    } catch (err) {
      setDepMsg(err.response?.data?.error || 'Error al remover dependencia.');
    }
  };

  // Participantes no inscritos aun (para el selector)
  const enrolledIds = new Set(participants.map((p) => p.participant_id || p.id));
  const availableForEnroll = (allParticipants || []).filter((p) => !enrolledIds.has(p.id));
  // Dependencias no asociadas aun
  const assocDepIds = new Set((dependencies || []).map((d) => d.dependency_id));
  const availableDeps = (allDependencies || []).filter((d) => !assocDepIds.has(d.id) && d.id !== course.dependency_id);

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{course.name}</h2>
          <p style={styles.meta}>
            {course.type} &nbsp;|&nbsp; {course.duration_hours ? `${course.duration_hours}h` : 'Duracion no especificada'} &nbsp;|&nbsp;
            {formatDate(course.start_date)} — {formatDate(course.end_date)}
          </p>
          {course.instructor && <p style={styles.meta}>Instructor: {course.instructor}</p>}
          {course.description && <p style={{ ...styles.meta, marginTop: '0.5rem' }}>{course.description}</p>}
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </div>

      {/* 23.11 - Dependencias colaboradoras */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Dependencias colaboradoras</h3>
        {depMsg && <Alert type="info" message={depMsg} dismissible style={{ marginBottom: '0.75rem' }} />}

        {dependencies?.length > 0 ? (
          <div style={styles.depList}>
            {dependencies.map((dep) => (
              <div key={dep.dependency_id} style={styles.depChip}>
                <span>{dep.dependency_name}</span>
                <button onClick={() => handleRemoveDep(dep.dependency_id)} style={styles.chipRemove} title="Quitar">
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.empty}>Sin dependencias colaboradoras.</p>
        )}

        {availableDeps.length > 0 && (
          <div style={styles.addRow}>
            <Select
              value={addDepId}
              onChange={(e) => setAddDepId(e.target.value)}
              options={availableDeps.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Agregar dependencia..."
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Button size="sm" onClick={handleAddDep} loading={addingDep} disabled={!addDepId}>
              Agregar
            </Button>
          </div>
        )}
      </section>

      {/* 23.13 - Participantes inscritos */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Participantes inscritos</h3>
        {statusMsg   && <Alert type="success" message={statusMsg}   dismissible style={{ marginBottom: '0.75rem' }} />}
        {statusError && <Alert type="error"   message={statusError} dismissible style={{ marginBottom: '0.75rem' }} />}

        {loadingPart ? (
          <p style={styles.empty}>Cargando...</p>
        ) : participants.length === 0 ? (
          <p style={styles.empty}>Sin participantes inscritos.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Cedula</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.participant_id || p.id} style={styles.tr}>
                    <td style={styles.td}>{p.full_name}</td>
                    <td style={styles.td}>{p.document_id}</td>
                    <td style={styles.td}>
                      <select
                        value={p.attendance_status}
                        onChange={(e) => handleStatusChange(p.participant_id || p.id, e.target.value)}
                        style={styles.statusSelect}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 23.14 - Inscribir participante */}
        {availableForEnroll.length > 0 && (
          <div style={{ ...styles.addRow, marginTop: '1rem' }}>
            {enrollMsg && <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{enrollMsg}</span>}
            <Select
              value={enrollId}
              onChange={(e) => setEnrollId(e.target.value)}
              options={availableForEnroll.map((p) => ({ value: p.id, label: `${p.full_name} (${p.document_id})` }))}
              placeholder="Inscribir participante..."
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Button size="sm" onClick={handleEnroll} loading={enrolling} disabled={!enrollId}>
              Inscribir
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container:    { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  title:        { fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '0.25rem' },
  meta:         { fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 },
  section:      { borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' },
  sectionTitle: { fontSize: '0.9375rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' },
  empty:        { fontSize: '0.875rem', color: 'var(--color-text-muted)' },
  depList:      { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' },
  depChip:      {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.25rem 0.625rem', backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.8125rem', fontWeight: '500',
  },
  chipRemove:   { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '1rem', lineHeight: 1, padding: 0 },
  addRow:       { display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' },
  tableWrapper: { overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  thead:        { backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' },
  th:           { padding: '0.625rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textAlign: 'left' },
  tr:           { borderBottom: '1px solid var(--color-border)' },
  td:           { padding: '0.625rem 1rem', color: 'var(--color-text-primary)' },
  statusSelect: {
    padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '0.8125rem',
    backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', cursor: 'pointer',
  },
};

export default CourseDetail;
