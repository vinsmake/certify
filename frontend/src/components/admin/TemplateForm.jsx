// 28.06 - Formulario de plantilla con editor HTML/CSS y preview

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import templateService from '../../services/templateService';

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

      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>
          Contenido HTML/CSS <span style={styles.required}>*</span>
        </label>
        <textarea
          value={htmlContent}
          onChange={(e) => { setHtmlContent(e.target.value); setErrors((p) => ({ ...p, html: '' })); }}
          rows={16}
          placeholder="<!DOCTYPE html>..."
          style={{ ...styles.textarea, borderColor: errors.html ? 'var(--color-danger, #ef4444)' : 'var(--color-border)' }}
          spellCheck={false}
        />
        {errors.html && <p style={styles.fieldError}>{errors.html}</p>}
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
  label:      { display: 'block', fontSize: '0.875rem', fontWeight: '500', color: 'var(--color-text-secondary)', marginBottom: '0.375rem' },
  required:   { color: 'var(--color-danger, #ef4444)' },
  textarea:   {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem', fontFamily: 'monospace',
    color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)',
    resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5',
  },
  fieldError: { fontSize: '0.8125rem', color: 'var(--color-danger, #ef4444)', marginTop: '0.25rem' },
  footer:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' },
  footerRight:{ display: 'flex', gap: '0.5rem' },
};

export default TemplateForm;
