import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastMessage } from '../../lib/toast';
import { Alert } from './Alert';

const DURATION_MS = 4000;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    subscribeToasts((t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), DURATION_MS);
    });
    return () => subscribeToasts(null);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toasts">
      {toasts.map((t) => (
        <Alert key={t.id} type={t.type} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
          {t.message}
        </Alert>
      ))}
    </div>
  );
};
