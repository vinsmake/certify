// 30.04 - Indicador de carga reutilizable

import React from 'react';

const Spinner = ({ size = 32, color = 'var(--color-primary)', style }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', ...style }}>
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid var(--color-border)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  </div>
);

export default Spinner;
