// 30.03 / 30.05 - Gestor de toasts independiente de React (permite uso desde api.js)

let listener = null;
let idCounter = 0;

export const subscribe = (fn) => { listener = fn; };

export const toast = {
  success: (message) => emit('success', message),
  error:   (message) => emit('error', message),
  warning: (message) => emit('warning', message),
  info:    (message) => emit('info', message),
};

function emit(type, message) {
  if (listener) {
    listener({ id: ++idCounter, type, message, timestamp: Date.now() });
  }
}
