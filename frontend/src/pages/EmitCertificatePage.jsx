// 26.01-26.11 - Pagina de emision de certificados (flujo paso a paso)

import React, { useState, useEffect } from 'react';
import courseService from '../services/courseService';
import certificateService from '../services/certificateService';
import templateService from '../services/templateService';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const EmitCertificatePage = () => {
  // Datos base
  const [courses,   setCourses]   = useState([]);
  const [templates, setTemplates] = useState([]);

  // Seleccion del usuario
  const [courseId,    setCourseId]    = useState('');
  const [templateId,  setTemplateId]  = useState('');

  // Participantes elegibles (completed + sin certificado valido)
  const [eligible,     setEligible]     = useState([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [selectedIds,  setSelectedIds]  = useState(new Set());

  // Curso seleccionado (objeto completo)
  const [selectedCourse,   setSelectedCourse]   = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Estado de emision
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [emitting,     setEmitting]     = useState(false);
  const [result,       setResult]       = useState(null);   // { emitted, already_exists, errors }
  const [emitError,    setEmitError]    = useState('');

  // Preview
  const [previewing, setPreviewing] = useState(false);

  // Cargar cursos y plantillas al montar
  useEffect(() => {
    courseService.getCourses({ limit: 200 })
      .then((d) => setCourses(d.data || []))
      .catch(() => {});
    templateService.getTemplates()
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // 26.02 - Al cambiar el curso, cargar participantes elegibles
  useEffect(() => {
    if (!courseId) {
      setEligible([]); setSelectedIds(new Set()); setSelectedCourse(null);
      return;
    }

    const course = courses.find((c) => String(c.id) === String(courseId));
    setSelectedCourse(course || null);
    setEligible([]); setSelectedIds(new Set());
    setLoadingParts(true);

    // 26.03 - Cargar participantes del curso y certificados ya emitidos
    Promise.all([
      courseService.getCourseParticipants(courseId),
      certificateService.getCertificates({ course_id: courseId, status: 'valid', limit: 500 }),
    ])
      .then(([parts, certs]) => {
        // IDs de participantes ya certificados (por document_id)
        const certifiedDocs = new Set((certs.data || []).map((c) => c.document_id));

        // Solo los que tienen completed y no tienen certificado valido aun
        const partsList = Array.isArray(parts) ? parts : (parts.participants || []);
        const eligibleParts = partsList.filter(
          (p) => p.attendance_status === 'completed' && !certifiedDocs.has(p.document_id)
        );
        setEligible(eligibleParts);
      })
      .catch(() => {})
      .finally(() => setLoadingParts(false));
  }, [courseId, courses]);

  // Actualizar plantilla seleccionada al cambiar templateId
  useEffect(() => {
    const tmpl = templates.find((t) => String(t.id) === String(templateId));
    setSelectedTemplate(tmpl || null);
  }, [templateId, templates]);

  // 26.05 - Seleccionar / deseleccionar todos
  const handleSelectAll = () => {
    if (selectedIds.size === eligible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible.map((p) => p.participant_id || p.id)));
    }
  };

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 26.06 - Preview de plantilla en nueva pestana
  const handlePreview = async () => {
    if (!templateId) return;
    setPreviewing(true);
    try {
      await templateService.previewTemplate(templateId);
    } catch {
      // Si falla el preview no bloqueamos al usuario
    } finally {
      setPreviewing(false);
    }
  };

  // 26.07-26.10 - Emitir certificados
  const handleEmit = async () => {
    setEmitting(true); setEmitError('');
    try {
      const res = await certificateService.emitCertificates({
        course_id:       parseInt(courseId),
        template_id:     parseInt(templateId),
        participant_ids: Array.from(selectedIds),
      });
      setResult(res);
      setShowConfirm(false);
      // Recargar elegibles para reflejar los nuevos certificados
      setCourseId((prev) => { const tmp = prev; setCourseId(''); setTimeout(() => setCourseId(tmp), 50); return ''; });
    } catch (err) {
      setEmitError(err.response?.data?.error || 'Error al emitir los certificados.');
    } finally {
      setEmitting(false);
    }
  };

  const allSelected  = eligible.length > 0 && selectedIds.size === eligible.length;
  const someSelected = selectedIds.size > 0;
  const canEmit      = courseId && templateId && someSelected;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Emitir Certificados</h1>

      {result && (
        <div style={styles.resultBox}>
          <h3 style={styles.resultTitle}>Resultado de la emision</h3>
          <p style={styles.resultLine}>
            <strong style={{ color: 'var(--color-success, #16a34a)' }}>
              Emitidos: {result.emitted?.length ?? 0}
            </strong>
          </p>
          {result.already_exists?.length > 0 && (
            <p style={styles.resultLine}>
              Ya certificados (omitidos): {result.already_exists.length}
            </p>
          )}
          {result.errors?.length > 0 && (
            <p style={{ ...styles.resultLine, color: 'var(--color-danger, #ef4444)' }}>
              Errores: {result.errors.length}
            </p>
          )}
          <Button size="sm" variant="secondary" style={{ marginTop: '0.75rem' }}
            onClick={() => setResult(null)}>
            Cerrar
          </Button>
        </div>
      )}

      {emitError && (
        <Alert type="error" message={emitError} dismissible style={{ marginBottom: '1rem' }} />
      )}

      {/* Paso 1: Seleccionar curso */}
      <section style={styles.section}>
        <h2 style={styles.stepTitle}>
          <span style={styles.stepNum}>1</span> Seleccionar Curso
        </h2>
        <div style={styles.row}>
          <Select
            id="course-select"
            label="Curso"
            value={courseId}
            onChange={(e) => { setCourseId(e.target.value); setResult(null); setEmitError(''); }}
            options={courses.map((c) => ({ value: c.id, label: `${c.name} — ${c.type}` }))}
            placeholder="Elige un curso..."
            style={{ maxWidth: '480px' }}
          />
        </div>
        {selectedCourse && (
          <div style={styles.courseInfo}>
            {selectedCourse.instructor && (
              <span style={styles.infoBadge}>Instructor: {selectedCourse.instructor}</span>
            )}
            <span style={styles.infoBadge}>
              {formatDate(selectedCourse.start_date)} — {formatDate(selectedCourse.end_date)}
            </span>
            {selectedCourse.duration_hours && (
              <span style={styles.infoBadge}>{selectedCourse.duration_hours}h</span>
            )}
          </div>
        )}
      </section>

      {/* Paso 2: Seleccionar plantilla */}
      {courseId && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>
            <span style={styles.stepNum}>2</span> Seleccionar Plantilla
          </h2>
          <div style={styles.row}>
            <Select
              id="template-select"
              label="Plantilla de certificado"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              options={templates.map((t) => ({
                value: t.id,
                label: `${t.name}${t.is_default ? ' (por defecto)' : ''} — ${t.orientation} / ${t.page_size}`,
              }))}
              placeholder="Elige una plantilla..."
              style={{ maxWidth: '480px' }}
            />
            {/* 26.06 - Preview */}
            {templateId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreview}
                loading={previewing}
                style={{ alignSelf: 'flex-end', marginBottom: '1rem' }}
              >
                Ver preview
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Paso 3: Participantes elegibles con checkboxes */}
      {courseId && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>
            <span style={styles.stepNum}>3</span> Participantes Elegibles
          </h2>
          <p style={styles.hint}>
            Solo se muestran participantes con asistencia <strong>Completada</strong> que
            aun no tienen un certificado valido para este curso.
          </p>

          {loadingParts ? (
            <p style={styles.empty}>Cargando participantes...</p>
          ) : eligible.length === 0 ? (
            <p style={styles.empty}>
              No hay participantes elegibles para este curso.<br />
              <span style={{ fontSize: '0.8125rem' }}>
                Verifica que hayan participantes con estado &quot;Completado&quot; sin certificado previo.
              </span>
            </p>
          ) : (
            <>
              {/* 26.05 - Seleccionar todos */}
              <div style={styles.selectAllRow}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    style={styles.checkbox}
                  />
                  Seleccionar todos ({eligible.length})
                </label>
                {someSelected && (
                  <span style={styles.selectedCount}>{selectedIds.size} seleccionado(s)</span>
                )}
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={{ ...styles.th, width: '40px' }}></th>
                      <th style={styles.th}>Cedula</th>
                      <th style={styles.th}>Nombre</th>
                      <th style={styles.th}>Organizacion</th>
                      <th style={styles.th}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligible.map((p) => {
                      const pid = p.participant_id || p.id;
                      return (
                        <tr
                          key={pid}
                          style={{ ...styles.tr, backgroundColor: selectedIds.has(pid) ? 'var(--color-primary-light, #eff6ff)' : 'transparent' }}
                          onClick={() => handleToggle(pid)}
                        >
                          <td style={styles.td}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(pid)}
                              onChange={() => handleToggle(pid)}
                              onClick={(e) => e.stopPropagation()}
                              style={styles.checkbox}
                            />
                          </td>
                          <td style={styles.td}>{p.document_id}</td>
                          <td style={styles.td}>{p.full_name}</td>
                          <td style={styles.td}>{p.organization || '—'}</td>
                          <td style={styles.td}><Badge status={p.attendance_status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* Paso 4: Boton emitir */}
      {canEmit && (
        <section style={styles.section}>
          <h2 style={styles.stepTitle}>
            <span style={styles.stepNum}>4</span> Emitir
          </h2>
          <p style={styles.hint}>
            Se emitiran <strong>{selectedIds.size}</strong> certificado(s) para el curso
            <strong> {selectedCourse?.name}</strong> usando la plantilla
            <strong> {selectedTemplate?.name}</strong>.
          </p>
          {/* 26.07 - Boton con confirmacion */}
          <Button onClick={() => setShowConfirm(true)}>
            Emitir {selectedIds.size} Certificado{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </section>
      )}

      {/* 26.07 - Modal de confirmacion */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirmar emision"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={emitting}>
              Cancelar
            </Button>
            <Button onClick={handleEmit} loading={emitting}>
              Confirmar y emitir
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <p style={styles.confirmLine}><strong>Curso:</strong> {selectedCourse?.name}</p>
          <p style={styles.confirmLine}><strong>Plantilla:</strong> {selectedTemplate?.name}</p>
          <p style={styles.confirmLine}><strong>Dependencia:</strong> {selectedCourse?.dependency_name || '—'}</p>
          <p style={styles.confirmLine}><strong>Participantes:</strong> {selectedIds.size}</p>
          <p style={{ ...styles.confirmLine, marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Se generara un PDF por cada participante. Esta accion no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  );
};

const styles = {
  page:        { display: 'flex', flexDirection: 'column', gap: '0' },
  title:       { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '1.5rem' },
  section:     { borderTop: '1px solid var(--color-border)', padding: '1.25rem 0' },
  stepTitle:   { display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '1rem' },
  stepNum:     {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: '1.5rem', height: '1.5rem', borderRadius: '50%',
    backgroundColor: 'var(--color-primary)', color: '#fff',
    fontSize: '0.8125rem', fontWeight: '700', flexShrink: 0,
  },
  row:         { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' },
  courseInfo:  { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.625rem' },
  infoBadge:   {
    padding: '0.2rem 0.625rem', borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-secondary)',
    fontSize: '0.8125rem',
  },
  hint:        { fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.875rem' },
  empty:       { fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.6' },
  selectAllRow:{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.625rem' },
  checkLabel:  { display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-primary)', cursor: 'pointer' },
  checkbox:    { width: '1rem', height: '1rem', cursor: 'pointer' },
  selectedCount:{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: '500' },
  tableWrapper:{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  thead:       { backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' },
  th:          { padding: '0.625rem 1rem', fontWeight: '600', color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textAlign: 'left' },
  tr:          { borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background-color 0.1s' },
  td:          { padding: '0.625rem 1rem', color: 'var(--color-text-primary)' },
  resultBox:   {
    padding: '1rem', borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--color-surface-hover)', border: '1px solid var(--color-border)',
    marginBottom: '1.25rem',
  },
  resultTitle: { fontSize: '0.9375rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-primary)' },
  resultLine:  { fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: '0.25rem 0' },
  confirmLine: { fontSize: '0.875rem', color: 'var(--color-text-primary)', margin: 0 },
};

export default EmitCertificatePage;
