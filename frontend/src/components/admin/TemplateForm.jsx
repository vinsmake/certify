// 28.06 - Formulario de plantilla con editor HTML/CSS y preview en tiempo real

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import templateService from '../../services/templateService';
import TemplatePreviewPanel from './TemplatePreviewPanel';

const ORIENTATION_OPTIONS = [
  { value: 'landscape', label: 'Horizontal (landscape)' },
  { value: 'portrait',  label: 'Vertical (portrait)'    },
];
const PAGE_OPTIONS = [
  { value: 'letter', label: 'Carta (letter)' },
  { value: 'A4',     label: 'A4'             },
];

const TemplateForm = ({ initial, onSubmit, onCancel, loading, error }) => {
  const [name,         setName]         = useState('');
  const [slug,         setSlug]         = useState('');
  const [description,  setDescription]  = useState('');
  const [htmlContent,  setHtmlContent]  = useState('');
  const [orientation,  setOrientation]  = useState('landscape');
  const [pageSize,     setPageSize]     = useState('letter');
  const [errors,       setErrors]       = useState({});
  const [previewing,   setPreviewing]   = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  useEffect(() => {
    if (initial) {
      setName(initial.name || '');
      setSlug(initial.slug || '');
      setDescription(initial.description || '');
      setHtmlContent(initial.html_content || '');
      setOrientation(initial.orientation || 'landscape');
      setPageSize(initial.page_size || 'letter');
    }
  }, [initial]);

  const validate = () => {
    const e = {};
    if (!name.trim())        e.name = 'El nombre es requerido.';
    if (!slug.trim())        e.slug = 'El slug es requerido.';
    if (!htmlContent.trim()) e.html = 'El contenido HTML es requerido.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      html_content: htmlContent,
      orientation,
      page_size: pageSize,
    });
  };

  // 28.07 - Preview del template actual (guardado)
  const handlePreview = async () => {
    if (!initial?.id) return;
    setPreviewing(true);
    try { await templateService.previewTemplate(initial.id); }
    catch { /* preview falla silenciosamente */ }
    finally { setPreviewing(false); }
  };

  // Auto-slug desde nombre
  const handleNameChange = (v) => {
    setName(v);
    setErrors((p) => ({ ...p, name: '' }));
    if (!initial) {
      setSlug(v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert type="error" message={error} style={{ marginBottom: '1rem' }} />}

      <div style={styles.row}>
        <div style={styles.col}>
          <Input label="Nombre" id="tmpl-name" value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name} required placeholder="Ej: Plantilla Formal" />
        </div>
        <div style={styles.col}>
          <Input label="Slug" id="tmpl-slug" value={slug}
            onChange={(e) => { setSlug(e.target.value); setErrors((p) => ({ ...p, slug: '' })); }}
            error={errors.slug} required placeholder="ej: plantilla-formal" />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.col}>
          <Select label="Orientacion" id="tmpl-orient" value={orientation}
            onChange={(e) => setOrientation(e.target.value)} options={ORIENTATION_OPTIONS} />
        </div>
        <div style={styles.col}>
          <Select label="Tamano de pagina" id="tmpl-size" value={pageSize}
            onChange={(e) => setPageSize(e.target.value)} options={PAGE_OPTIONS} />
        </div>
      </div>

      <Input label="Descripcion" id="tmpl-desc" value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripcion breve (opcional)" />

      {/* Barra de herramientas del editor */}
      <div style={styles.editorToolbar}>
        <label style={styles.label}>
          Contenido HTML/CSS <span style={styles.required}>*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowLivePreview((p) => !p)}
          style={{
            ...styles.togglePreviewBtn,
            backgroundColor: showLivePreview ? 'var(--color-primary, #2563eb)' : 'transparent',
            color: showLivePreview ? '#fff' : 'var(--color-text-secondary)',
          }}
          title={showLivePreview ? 'Ocultar preview' : 'Mostrar preview'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {showLivePreview ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
          {showLivePreview ? 'Ocultar preview' : 'Preview en vivo'}
        </button>
      </div>

      {/* Layout editor + preview */}
      <div style={{
        ...styles.editorLayout,
        gridTemplateColumns: showLivePreview ? '1fr 1fr' : '1fr',
      }}>
        {/* Panel del editor */}
        <div style={styles.editorPanel}>
          <textarea
            value={htmlContent}
            onChange={(e) => { setHtmlContent(e.target.value); setErrors((p) => ({ ...p, html: '' })); }}
            rows={showLivePreview ? 22 : 16}
            placeholder="<!DOCTYPE html>..."
            style={{
              ...styles.textarea,
              height: showLivePreview ? '100%' : undefined,
              borderColor: errors.html ? 'var(--color-danger, #ef4444)' : 'var(--color-border)',
            }}
            spellCheck={false}
          />
          {errors.html && <p style={styles.fieldError}>{errors.html}</p>}
        </div>

        {/* Panel de preview en tiempo real */}
        {showLivePreview && (
          <div style={styles.previewPanel}>
            <TemplatePreviewPanel
              htmlContent={htmlContent}
              orientation={orientation}
              pageSize={pageSize}
            />
          </div>
        )}
      </div>

      <div style={styles.footer}>
        {initial?.id && (
          <Button type="button" variant="ghost" onClick={handlePreview} loading={previewing}>
            Ver preview
          </Button>
        )}
        <div style={styles.footerRight}>
          <Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? 'Guardar cambios' : 'Crear plantilla'}</Button>
        </div>
      </div>
    </form>
  );
};

const styles = {
  row:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  col:        {},
  label:      { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: 0 },
  required:   { color: 'var(--color-danger, #ef4444)' },
  editorToolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem',
  },
  togglePreviewBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
    padding: '0.3rem 0.75rem', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontWeight: '500',
    cursor: 'pointer', transition: 'var(--transition, all 0.15s ease)',
    whiteSpace: 'nowrap',
  },
  editorLayout: {
    display: 'grid', gap: '0.75rem', marginBottom: '1rem',
    alignItems: 'stretch',
  },
  editorPanel: {
    display: 'flex', flexDirection: 'column', minWidth: 0,
  },
  previewPanel: {
    display: 'flex', flexDirection: 'column', minWidth: 0,
    minHeight: '400px',
  },
  textarea:   {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem', fontFamily: 'monospace',
    color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)',
    resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5',
    flex: 1,
  },
  fieldError: { fontSize: '0.8125rem', color: 'var(--color-danger, #ef4444)', marginTop: '0.25rem' },
  footer:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' },
  footerRight:{ display: 'flex', gap: '0.5rem' },
};

export default TemplateForm;
