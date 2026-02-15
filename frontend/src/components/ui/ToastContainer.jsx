// 30.03 - Contenedor de notificaciones toast

import React, { useState, useEffect, useCallback } from 'react';
import { subscribe } from '../../utils/toastManager';

const TOAST_DURATION = 4000;

const TYPE_STYLES = {
  success: { bg: '#dcfce7', color: '#16a34a', border: '#86efac', icon: '\u2713' },
  error:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', icon: '\u2715' },
  warning: { bg: '#fef9c3', color: '#ca8a04', border: '#fcd34d', icon: '\u26a0' },
  info:    { bg: '#dbeafe', color: '#2563eb', border: '#93c5fd', icon: '\u2139' },
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, TOAST_DURATION);
  }, []);

  useEffect(() => {
    subscribe(addToast);
    return () => subscribe(null);
  }, [addToast]);

  const dismiss = (id) => setToasts((prev) => prev.filter((x) => x.id !== id));

  if (!toasts.length) return null;

  return (
    <div style={styles.container}>
      {toasts.map((t) => {
        const cfg = TYPE_STYLES[t.type] || TYPE_STYLES.info;
        return (
          <div key={t.id} style={{ ...styles.toast, backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color }}>
            <span style={styles.icon}>{cfg.icon}</span>
            <span style={styles.message}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} style={{ ...styles.close, color: cfg.color }}>&times;</button>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    maxWidth: '380px', width: '100%', pointerEvents: 'none',
  },
  toast: {
    display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
    padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid',
    fontSize: '0.875rem', lineHeight: 1.4, pointerEvents: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    animation: 'toast-in 0.25s ease-out',
  },
  icon:    { fontWeight: '700', flexShrink: 0, marginTop: '0.05rem' },
  message: { flex: 1 },
  close:   { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0, opacity: 0.7, flexShrink: 0 },
};

export default ToastContainer;
