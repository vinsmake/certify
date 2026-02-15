import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';

// Placeholder para rutas que se implementaran en bloques posteriores
const PlaceholderPage = ({ title }) => (
  <div>
    <h2 style={{ marginBottom: '0.5rem' }}>{title}</h2>
    <p style={{ color: 'var(--color-text-muted)' }}>
      Esta seccion se implementara proximamente.
    </p>
  </div>
);

// Placeholder pagina de verificacion publica (Bloque 27)
const VerifyPlaceholder = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Verificacion de Certificado</h2>
    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
      Esta pagina se implementara en el Bloque 27.
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 20.10 - Ruta publica: login */}
          <Route path="/login" element={<LoginPage />} />

          {/* 20.09 - Ruta publica: verificacion de certificado */}
          <Route path="/verificar/:uuid" element={<VerifyPlaceholder />} />

          {/* 20.11 - Rutas protegidas con layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"     element={<DashboardPage />} />
              <Route path="/cursos"        element={<CoursesPage />} />
              <Route path="/participantes" element={<PlaceholderPage title="Participantes" />} />
              <Route path="/certificados"  element={<PlaceholderPage title="Certificados" />} />
              <Route path="/emitir"        element={<PlaceholderPage title="Emitir Certificados" />} />

              {/* 20.12 - Rutas solo admin */}
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
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
