// 30.06 - Dialogo de confirmacion reutilizable para acciones destructivas

import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar accion',
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  loading = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }
  >
    {typeof message === 'string' ? <p style={{ margin: 0, lineHeight: 1.5 }}>{message}</p> : message}
  </Modal>
);

export default ConfirmDialog;
