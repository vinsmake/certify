// 21.03 - Modal generico con overlay, titulo, contenido y botones de accion

import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando el modal esta abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const widths = { sm: '400px', md: '540px', lg: '720px' };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{ ...styles.modal, maxWidth: widths[size] || widths.md }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Cerrar">
            &times;
          </button>
        </div>

        <div style={styles.body}>
          {children}
        </div>

        {footer && (
          <div style={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    lineHeight: 1,
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '0 0.25rem',
    transition: 'var(--transition)',
  },
  body: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    flexShrink: 0,
  },
};

export default Modal;
