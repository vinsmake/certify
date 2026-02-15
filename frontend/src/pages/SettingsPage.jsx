// 29.01-29.05 - Configuracion de branding institucional (solo admin)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import templateService from '../services/templateService';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const FONT_OPTIONS = ['Arial', 'Georgia', 'Times New Roman', 'Helvetica', 'Verdana', 'Trebuchet MS'];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// 29.02 - Seccion de branding activo actual
const ActiveBrandingSection = ({ active, onLogoUpload, onPreview }) => {
  const fileRef = useRef(null);

  if (!active) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No hay version activa.</p>;
  }

  const logoSrc = active.logo_path ? `${BACKEND}${active.logo_path}` : null;

  return (
    <div style={styles.activeCard}>
      <div style={styles.activeLeft}>
        {logoSrc ? (
          <img
            src={logoSrc}
            alt="Logo institucional"
            style={styles.logo}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={styles.logoPlaceholder}>Sin logo</div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files[0]) onLogoUpload(active.id, e.target.files[0]); e.target.value = ''; }}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
          style={{ marginTop: '0.5rem' }}
        >
          Subir logo
        </Button>
      </div>

      <div style={styles.activeRight}>
        <div style={styles.activeField}>
          <span style={styles.fieldLabel}>Version</span>
          <span style={styles.fieldValue}>{active.version_label}</span>
        </div>
        <div style={styles.activeField}>
          <span style={styles.fieldLabel}>Organizacion</span>
          <span style={styles.fieldValue}>{active.organization_name}</span>
        </div>
        <div style={styles.activeField}>
          <span style={styles.fieldLabel}>Fuente</span>
          <span style={styles.fieldValue}>{active.font_family}</span>
        </div>
        <div style={styles.activeField}>
          <span style={styles.fieldLabel}>Colores</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ ...styles.colorSwatch, background: active.primary_color }} title={`Principal: ${active.primary_color}`} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{active.primary_color}</span>
            <span style={{ ...styles.colorSwatch, background: active.secondary_color, marginLeft: '0.25rem' }} title={`Secundario: ${active.secondary_color}`} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{active.secondary_color}</span>
          </div>
        </div>
      </div>

      <div style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}>
        <Button variant="secondary" onClick={onPreview}>Vista previa certificado</Button>
      </div>
    </div>
  );
};

// 29.03 - Formulario para crear nueva version de branding
const EMPTY_FORM = {
  version_label: '',
  organization_name: '',
  font_family: 'Arial',
  primary_color: '#1e40af',
  secondary_color: '#64748b',
};

const NewVersionForm = ({ onCreated }) => {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/branding/versions', form);
      setForm(EMPTY_FORM);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la version.');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.card}>
      {error && <Alert type="error" message={error} dismissible style={{ marginBottom: '0.75rem' }} />}
      <div style={styles.formGrid}>
        <label style={styles.label}>
          Etiqueta de version *
          <input
            style={styles.input}
            value={form.version_label}
            onChange={(e) => set('version_label', e.target.value)}
            required
            placeholder="ej. v2.0 - Nuevo diseno"
          />
        </label>
        <label style={styles.label}>
          Nombre de organizacion *
          <input
            style={styles.input}
            value={form.organization_name}
            onChange={(e) => set('organization_name', e.target.value)}
            required
            placeholder="ej. Universidad Nacional"
          />
        </label>
        <label style={styles.label}>
          Fuente
          <select style={styles.input} value={form.font_family} onChange={(e) => set('font_family', e.target.value)}>
            {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ ...styles.label, flex: 1, minWidth: '180px' }}>
            Color principal
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={form.primary_color}
                onChange={(e) => set('primary_color', e.target.value)}
                style={styles.colorInput}
              />
              <input
                style={{ ...styles.input, flex: 1, fontFamily: 'monospace' }}
                value={form.primary_color}
                onChange={(e) => set('primary_color', e.target.value)}
                placeholder="#1e40af"
              />
            </div>
          </label>
          <label style={{ ...styles.label, flex: 1, minWidth: '180px' }}>
            Color secundario
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={form.secondary_color}
                onChange={(e) => set('secondary_color', e.target.value)}
                style={styles.colorInput}
              />
              <input
                style={{ ...styles.input, flex: 1, fontFamily: 'monospace' }}
                value={form.secondary_color}
                onChange={(e) => set('secondary_color', e.target.value)}
                placeholder="#64748b"
              />
            </div>
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Button type="submit" loading={loading}>Crear version</Button>
      </div>
    </form>
  );
};

// 29.04 - Fila individual del historial (componente propio para manejar ref de file input)
const VersionRow = ({ version, onActivate, onLogoUpload }) => {
  const fileRef = useRef(null);
  const logoSrc = version.logo_path ? `${BACKEND}${version.logo_path}` : null;

  return (
    <div style={{ ...styles.historyItem, ...(version.is_active ? styles.historyItemActive : {}) }}>
      <div style={styles.historyLeft}>
        {logoSrc ? (
          <img src={logoSrc} alt="logo" style={styles.logoSmall} onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={styles.logoSmallPlaceholder} />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files[0]) onLogoUpload(version.id, e.target.files[0]); e.target.value = ''; }}
        />
      </div>

      <div style={styles.historyMid}>
        <span style={styles.historyLabel}>{version.version_label}</span>
        <span style={styles.historyOrg}>{version.organization_name}</span>
        <span style={styles.historyDate}>{formatDate(version.created_at)}</span>
      </div>

      <div style={styles.historyColors}>
        <span style={{ ...styles.colorSwatch, background: version.primary_color }} title={version.primary_color} />
        <span style={{ ...styles.colorSwatch, background: version.secondary_color }} title={version.secondary_color} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{version.font_family}</span>
      </div>

      <div style={styles.historyActions}>
        {version.is_active ? (
          <span style={styles.activeBadge}>Activa</span>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onActivate(version)}>Activar</Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Logo</Button>
      </div>
    </div>
  );
};

// 29.04 - Historial de versiones de branding
const VersionHistory = ({ versions, onActivate, onLogoUpload }) => {
  if (!versions.length) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No hay versiones registradas.</p>;
  }
  return (
    <div style={styles.historyList}>
      {versions.map((v) => (
        <VersionRow key={v.id} version={v} onActivate={onActivate} onLogoUpload={onLogoUpload} />
      ))}
    </div>
  );
};

// 29.01 - Pagina principal de configuracion
const SettingsPage = () => {
  const [active,     setActive]     = useState(null);
  const [versions,   setVersions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg,   setErrorMsg]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/branding/active').then((r) => r.data).catch(() => null),
      api.get('/branding/versions').then((r) => r.data || []).catch(() => []),
    ]).then(([activeData, versionsData]) => {
      setActive(activeData);
      setVersions(Array.isArray(versionsData) ? versionsData : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogoUpload = async (id, file) => {
    const form = new FormData();
    form.append('logo', file);
    try {
      await api.post(`/branding/versions/${id}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessMsg('Logo actualizado.');
      load();
    } catch {
      setErrorMsg('Error al subir el logo.');
    }
  };

  const handleActivate = async (version) => {
    try {
      await api.put(`/branding/versions/${version.id}/activate`);
      setSuccessMsg(`Version "${version.version_label}" activada.`);
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Error al activar la version.');
    }
  };

  // 29.05 - Preview visual: genera PDF con plantilla default y branding activo
  const handlePreview = async () => {
    try {
      const templates = await api.get('/templates').then((r) => r.data);
      const list = Array.isArray(templates) ? templates : [];
      const def = list.find((t) => t.is_default) || list[0];
      if (!def) { setErrorMsg('No hay plantillas disponibles para el preview.'); return; }
      await templateService.previewTemplate(def.id);
    } catch {
      setErrorMsg('No se pudo generar el preview.');
    }
  };

  const handleCreated = (newVersion) => {
    setSuccessMsg(`Version "${newVersion.version_label}" creada. Puedes subir el logo y activarla desde el historial.`);
    load();
  };

  return (
    <div>
      <h1 style={styles.title}>Configuracion</h1>

      {successMsg && <Alert type="success" message={successMsg} dismissible style={{ marginBottom: '1rem' }} />}
      {errorMsg   && <Alert type="error"   message={errorMsg}   dismissible style={{ marginBottom: '1rem' }} />}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cargando...</p>
      ) : (
        <>
          {/* 29.02 - Branding activo */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Branding Institucional Activo</h2>
            <ActiveBrandingSection
              active={active}
              onLogoUpload={handleLogoUpload}
              onPreview={handlePreview}
            />
          </section>

          {/* 29.03 - Nueva version */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Nueva Version de Branding</h2>
            <NewVersionForm onCreated={handleCreated} />
          </section>

          {/* 29.04 - Historial */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Historial de Versiones</h2>
            <VersionHistory
              versions={versions}
              onActivate={handleActivate}
              onLogoUpload={handleLogoUpload}
            />
          </section>
        </>
      )}
    </div>
  );
};

const styles = {
  title:        { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '1.5rem' },
  section:      { marginBottom: '2rem' },
  sectionTitle: {
    fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-primary)',
    marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)',
  },
  card: {
    padding: '1.25rem',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  },
  activeCard: {
    display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap',
    padding: '1.25rem',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  },
  activeLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px' },
  logo: {
    width: '80px', height: '80px', objectFit: 'contain',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  },
  logoPlaceholder: {
    width: '80px', height: '80px',
    backgroundColor: 'var(--color-surface-hover)',
    borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center',
  },
  activeRight:  { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem' },
  activeField:  { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  fieldLabel:   { fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldValue:   { fontSize: '0.9375rem', fontWeight: '500', color: 'var(--color-text-primary)' },
  colorSwatch:  { display: 'inline-block', width: '1.25rem', height: '1.25rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 },
  colorInput:   { width: '2.5rem', height: '2.125rem', cursor: 'pointer', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.125rem' },
  formGrid:     { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  label:        { display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-secondary)' },
  input:        {
    padding: '0.4375rem 0.625rem',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem', color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-background)', outline: 'none',
  },
  historyList:  { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  historyItem:  {
    display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  },
  historyItemActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  historyLeft:  { flexShrink: 0 },
  logoSmall:    { width: '40px', height: '40px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' },
  logoSmallPlaceholder: { width: '40px', height: '40px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--color-border)' },
  historyMid:   { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: '160px' },
  historyLabel: { fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-primary)' },
  historyOrg:   { fontSize: '0.8125rem', color: 'var(--color-text-secondary)' },
  historyDate:  { fontSize: '0.75rem', color: 'var(--color-text-muted)' },
  historyColors: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  historyActions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  activeBadge:  { padding: '0.2rem 0.6rem', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' },
};

export default SettingsPage;
