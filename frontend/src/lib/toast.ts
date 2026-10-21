// Notificaciones globales independientes de React (se pueden lanzar desde el cliente HTTP).

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (toast: ToastMessage) => void;

let listener: Listener | null = null;
let nextId = 0;

export const subscribeToasts = (fn: Listener | null) => {
  listener = fn;
};

const emit = (type: ToastType, message: string) => listener?.({ id: ++nextId, type, message });

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  warning: (message: string) => emit('warning', message),
  info: (message: string) => emit('info', message),
};
