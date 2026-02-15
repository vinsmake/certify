// 25.05-25.11 - Vista detallada de un certificado: info completa, descarga PDF y revocacion

import React, { useState } from 'react';
import certificateService from '../../services/certificateService';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const Row = ({ label, value }) => (
  <div style={styles.row}>
    <span style={styles.label}>{label}</span>
    <span style={styles.value}>{value ?? '—'}</span>
  </div>
);

const CertificateDetail = ({ certificate, onClose, onRevoked }) => {
  const [showRevoke,  setShowRevoke]  = useState(false);
  const [reason,      setReason]      = useState('');
  const [revoking,    setRevoking]    = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState('');
  const [reasonError, setReasonError] = useState('');

  const c = certificate;

  // 25.07-25.08 - Descargar PDF
  const handleDownload = async () => {
    setDownloading(true); setError('');
    try {
      await certificateService.downloadCertificate(c.id, c.uuid);
    } catch {
      setError('No se pudo descargar el PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // 25.09-25.11 - Revocar
  const handleRevoke = async () => {
    if (!reason.trim()) { setReasonError('La razon es requerida.'); return; }
    setRevoking(true); setError(''); setReasonError('');
    try {
      await certificateService.revokeCertificate(c.id, reason.trim());
      onRevoked();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al revocar el certificado.');
      setRevoking(false);
    }
  };

  return (
    <div style={styles.container}>
      {error && <Alert type="error" message={error} dismissible style={{ marginBottom: '1rem' }} />}

      {/* Encabezado */}
      <div style={styles.header}>
        <div>
          <div style={styles.uuidRow}>
            <span style={styles.uuidLabel}>UUID:</span>
            <span style={styles.uuid}>{c.uuid}</span>
          </div>
          <div style={{ marginTop: '0.375rem' }}>
            <Badge status={c.status} />
            {c.status === 'revoked' && c.revoked_at && (
              <span style={styles.revokedMeta}>
                &nbsp;— Revocado el {formatDate(c.revoked_at)}
              </span>
            )}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
      </div>

      {/* Participante */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Participante</h3>
        <Row label="Nombre"       value={c.participant_name} />
        <Row label="Cedula"       value={c.document_id} />
        <Row label="Correo"       value={c.participant_email} />
        <Row label="Organizacion" value={c.organization} />
        <Row label="Cargo"        value={c.position} />
      </section>

      {/* Curso */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Curso</h3>
        <Row label="Nombre"      value={c.course_name} />
        <Row label="Tipo"        value={c.course_type} />
        <Row label="Dependencia" value={c.dependency_name} />
        <Row label="Duracion"    value={c.duration_hours ? `${c.duration_hours}h` : null} />
        <Row label="Instructor"  value={c.instructor} />
        <Row label="Inicio"      value={formatDate(c.start_date)} />
        <Row label="Fin"         value={formatDate(c.end_date)} />
      </section>

      {/* Certificado */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Certificado</h3>
        <Row label="Fecha de emision"  value={formatDate(c.issue_date)} />
        <Row label="Plantilla"         value={c.template_name} />
        <Row label="Orientacion"       value={c.orientation} />
        <Row label="Branding"          value={c.branding_label} />
        <Row label="Organizacion"      value={c.organization_name} />
        <Row label="Emitido por"       value={c.issued_by_name} />
        {c.status === 'revoked' && (
          <Row label="Razon de revocacion" value={c.revocation_reason} />
        )}
      </section>

      {/* Acciones */}
      <div style={styles.actions}>
        <Button onClick={handleDownload} loading={downloading} disabled={!c.pdf_path}>
          Descargar PDF
        </Button>

        {/* 25.09 - Solo mostrar revocar si el certificado es valido */}
        {c.status === 'valid' && !showRevoke && (
          <Button variant="danger" onClick={() => setShowRevoke(true)}>
            Revocar
          </Button>
        )}
      </div>

      {/* 25.10 - Modal inline de revocacion */}
      {showRevoke && (
        <div style={styles.revokeBox}>
          <h4 style={styles.revokeTitle}>Revocar certificado</h4>
          <p style={styles.revokeDesc}>
            Esta accion es irreversible. El certificado quedara marcado como revocado
            y la pagina de verificacion mostrara este estado.
          </p>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setReasonError(''); }}
            placeholder="Escribe la razon de revocacion..."
            rows={3}
            style={{ ...styles.textarea, borderColor: reasonError ? 'var(--color-danger)' : 'var(--color-border)' }}
          />
          {reasonError && <p style={styles.fieldError}>{reasonError}</p>}
          <div style={styles.revokeActions}>
            <Button variant="secondary" onClick={() => { setShowRevoke(false); setReason(''); setReasonError(''); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleRevoke} loading={revoking}>
              Confirmar revocacion
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container:    { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  uuidRow:      { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  uuidLabel:    { fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)' },
  uuid:         { fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-text-primary)', wordBreak: 'break-all' },
  revokedMeta:  { fontSize: '0.8125rem', color: 'var(--color-text-muted)' },
  section:      { borderTop: '1px solid var(--color-border)', paddingTop: '1rem' },
  sectionTitle: { fontSize: '0.9375rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '0.625rem' },
  row:          { display: 'flex', gap: '0.75rem', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border-subtle, #f0f0f0)', flexWrap: 'wrap' },
  label:        { fontSize: '0.8125rem', fontWeight: '500', color: 'var(--color-text-muted)', minWidth: '140px' },
  value:        { fontSize: '0.875rem', color: 'var(--color-text-primary)', flex: 1 },
  actions:      { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' },
  revokeBox:    {
    border: '1px solid var(--color-danger, #ef4444)', borderRadius: 'var(--radius-lg)',
    padding: '1rem', backgroundColor: 'rgba(239,68,68,0.04)',
  },
  revokeTitle:  { fontSize: '0.9375rem', fontWeight: '600', color: 'var(--color-danger, #ef4444)', marginBottom: '0.5rem' },
  revokeDesc:   { fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' },
  textarea:     {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem', color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)', resize: 'vertical',
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
  fieldError:   { fontSize: '0.8125rem', color: 'var(--color-danger, #ef4444)', marginTop: '0.25rem' },
  revokeActions:{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' },
};

export default CertificateDetail;
