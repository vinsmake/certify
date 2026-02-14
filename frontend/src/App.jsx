import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import LoginPage from './pages/LoginPage';

// Placeholder para rutas que se implementaran en bloques posteriores
const PlaceholderPage = ({ title }) => (
  <div style={{ padding: '2rem' }}>
    <h2>{title}</h2>
    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
      Esta seccion se implementara proximamente.
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas publicas */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas (requieren autenticacion) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard"     element={<PlaceholderPage title="Dashboard" />} />
            <Route path="/cursos"        element={<PlaceholderPage title="Cursos" />} />
            <Route path="/participantes" element={<PlaceholderPage title="Participantes" />} />
            <Route path="/certificados"  element={<PlaceholderPage title="Certificados" />} />
            <Route path="/emitir"        element={<PlaceholderPage title="Emitir Certificados" />} />

            {/* Rutas solo admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dependencias"         element={<PlaceholderPage title="Dependencias" />} />
              <Route path="/admin/plantillas"           element={<PlaceholderPage title="Plantillas" />} />
              <Route path="/admin/usuarios"             element={<PlaceholderPage title="Usuarios" />} />
              <Route path="/admin/eventos"              element={<PlaceholderPage title="Eventos Globales" />} />
              <Route path="/admin/certificados-global"  element={<PlaceholderPage title="Certificados Global" />} />
              <Route path="/admin/actividad"            element={<PlaceholderPage title="Actividad" />} />
              <Route path="/configuracion"              element={<PlaceholderPage title="Configuracion" />} />
            </Route>
          </Route>

          {/* Redirigir raiz a dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Ruta no encontrada */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
