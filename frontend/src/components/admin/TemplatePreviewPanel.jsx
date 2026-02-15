// 15.02.26 - Panel de preview en tiempo real para plantillas HTML/CSS
// Renderiza el HTML dentro de un iframe aislado, reemplazando placeholders con datos de ejemplo

import React, { useRef, useEffect, useState, useMemo } from 'react';

// Datos de ejemplo para reemplazar los placeholders de la plantilla
const SAMPLE_DATA = {
  // Branding
  primary_color: '#1e3a5f',
  secondary_color: '#c9a84c',
  font_family: 'Georgia',
  org_logo_url: '',
  dep_logo_url: '',
  organization_name: 'Universidad Ejemplo',
  institutional_logo_base64: '',

  // Participante
  participant_name: 'Juan Carlos Perez Lopez',
  participant_document: 'CI-12345678',
  document_id: '12345678',

  // Curso
  course_name: 'Diplomado en Gestion de Proyectos',
  course_description: 'Por haber completado satisfactoriamente el programa de formacion con una duracion de 120 horas academicas.',
  course_hours: '120',
  course_duration: '120',
  course_type: 'Diplomado',
  course_start_date: '15 de enero de 2026',
  course_end_date: '15 de febrero de 2026',
  instructor: 'Dr. Maria Rodriguez',

  // Certificado
  certificate_code: 'CERT-2026-00001',
  certificate_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  certificate_date: '15 de febrero de 2026',
  issue_date: '15 de febrero de 2026',
  verification_url: 'https://certificados.ejemplo.com/verify/CERT-2026-00001',
  qr_code_url: '',
  qr_code_base64: '',

  // Organizacion / Dependencia
  org_name: 'Universidad Ejemplo',
  dependency_name: 'Direccion de Educacion Continua',
  dependency_names: '',
  dependency_logos_html: '<div style="display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:20px;"><div style="display:flex;flex-direction:column;align-items:center;text-align:center;min-width:80px;"><div style="width:50px;height:50px;background:#ddd;border-radius:6px;"></div><div style="font-size:10px;color:#666;margin-top:4px;">Dependencia A</div></div><div style="display:flex;flex-direction:column;align-items:center;text-align:center;min-width:80px;"><div style="width:50px;height:50px;background:#ddd;border-radius:6px;"></div><div style="font-size:10px;color:#666;margin-top:4px;">Dependencia B</div></div></div>',

  // Firmas
  signer_name: 'Dr. Maria Rodriguez',
  signer_title: 'Directora Academica',
  signer_name_2: 'Ing. Carlos Mendoza',
  signer_title_2: 'Coordinador de Programas',
};

/**
 * Reemplaza placeholders {{key}} con valores de ejemplo
 */
const replacePlaceholders = (html) => {
  if (!html) return '';
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return SAMPLE_DATA[key] !== undefined ? SAMPLE_DATA[key] : match;
  });
};

/**
 * Calcula las dimensiones del documento segun orientacion y tamano de pagina
 */
const getPageDimensions = (orientation, pageSize) => {
  const sizes = {
    letter: { width: 1056, height: 816 },
    A4:     { width: 1123, height: 794 },
  };
  const base = sizes[pageSize] || sizes.letter;
  if (orientation === 'portrait') {
    return { width: base.height, height: base.width };
  }
  return base;
};

const TemplatePreviewPanel = ({ htmlContent, orientation = 'landscape', pageSize = 'letter' }) => {
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [containerWidth, setContainerWidth] = useState(0);

  const pageDims = useMemo(() => getPageDimensions(orientation, pageSize), [orientation, pageSize]);

  // Observar tamano del contenedor para ajustar escala
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      setContainerWidth(rect.width);
      const padding = 24;
      const availableWidth = rect.width - padding;
      const newScale = Math.min(availableWidth / pageDims.width, 0.85);
      setScale(Math.max(newScale, 0.2));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageDims.width]);

  // Actualizar contenido del iframe
  const processedHtml = useMemo(() => replacePlaceholders(htmlContent), [htmlContent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(processedHtml || defaultPreviewHtml);
    doc.close();
  }, [processedHtml]);

  const scaledWidth = pageDims.width * scale;
  const scaledHeight = pageDims.height * scale;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span style={styles.headerTitle}>Preview en tiempo real</span>
        </div>
        <span style={styles.headerMeta}>
          {pageDims.width}x{pageDims.height}px &middot; {Math.round(scale * 100)}%
        </span>
      </div>

      <div ref={containerRef} style={styles.container}>
        {!htmlContent?.trim() ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p style={styles.emptyText}>Escribe HTML/CSS en el editor para ver el preview</p>
          </div>
        ) : (
          <div style={styles.previewScroller}>
            <div style={{
              ...styles.previewFrame,
              width: scaledWidth,
              height: scaledHeight,
            }}>
              <iframe
                ref={iframeRef}
                title="Template Preview"
                sandbox="allow-same-origin"
                style={{
                  ...styles.iframe,
                  width: pageDims.width,
                  height: pageDims.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={styles.legendBar}>
        <span style={styles.legendTitle}>Placeholders disponibles:</span>
        <div style={styles.legendTags}>
          {['participant_name', 'course_name', 'certificate_date', 'org_name', 'primary_color', 'secondary_color'].map((tag) => (
            <code key={tag} style={styles.legendTag}>{`{{${tag}}}`}</code>
          ))}
          <span style={styles.legendMore}>y mas...</span>
        </div>
      </div>
    </div>
  );
};

const defaultPreviewHtml = `
<!DOCTYPE html>
<html><head><style>
  body {
    display: flex; align-items: center; justify-content: center;
    height: 100vh; margin: 0; font-family: sans-serif;
    background: #f8f9fa; color: #adb5bd;
  }
  p { font-size: 14px; text-align: center; }
</style></head>
<body><p>Sin contenido</p></body></html>
`;

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    backgroundColor: 'var(--color-surface)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--color-text-secondary)',
  },
  headerTitle: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
  },
  headerMeta: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted, #9ca3af)',
    fontFamily: 'monospace',
  },
  container: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#e5e7eb',
    backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
    backgroundSize: '16px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '12px',
    minHeight: '300px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '300px',
    color: 'var(--color-text-muted, #9ca3af)',
    gap: '0.75rem',
  },
  emptyText: {
    fontSize: '0.875rem',
    textAlign: 'center',
    maxWidth: '220px',
    lineHeight: '1.5',
  },
  previewScroller: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  previewFrame: {
    borderRadius: '4px',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  iframe: {
    border: 'none',
    display: 'block',
    backgroundColor: '#fff',
  },
  legendBar: {
    padding: '0.5rem 0.75rem',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    flexShrink: 0,
  },
  legendTitle: {
    fontSize: '0.6875rem',
    fontWeight: '600',
    color: 'var(--color-text-muted, #9ca3af)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '0.25rem',
  },
  legendTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
    alignItems: 'center',
  },
  legendTag: {
    fontSize: '0.6875rem',
    fontFamily: 'monospace',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '3px',
    padding: '1px 5px',
    color: 'var(--color-text-secondary)',
  },
  legendMore: {
    fontSize: '0.6875rem',
    color: 'var(--color-text-muted, #9ca3af)',
    fontStyle: 'italic',
  },
};

export default TemplatePreviewPanel;
