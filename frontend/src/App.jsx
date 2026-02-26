import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ToastContainer from './components/ui/ToastContainer';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import ParticipantsPage from './pages/ParticipantsPage';
import CertificatesPage from './pages/CertificatesPage';
import EmitCertificatePage from './pages/EmitCertificatePage';
import VerifyPage from './pages/VerifyPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DependenciesPage from './pages/admin/DependenciesPage';
import TemplatesPage from './pages/admin/TemplatesPage';
import UsersPage from './pages/admin/UsersPage';
import GlobalEventsPage from './pages/admin/GlobalEventsPage';
import GlobalCertificatesPage from './pages/admin/GlobalCertificatesPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import SettingsPage from './pages/SettingsPage';
import TagsPage from './pages/admin/TagsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* 30.03 - Notificaciones toast globales */}
        <ToastContainer />

        <Routes>
          {/* 20.10 - Ruta publica: login */}
          <Route path="/login" element={<LoginPage />} />

          {/* 20.09 - Ruta publica: verificacion de certificado */}
          <Route path="/verificar/:uuid" element={<VerifyPage />} />

          {/* 30.02 - Ruta publica: acceso denegado */}
          <Route path="/no-autorizado" element={<UnauthorizedPage />} />

          {/* 20.11 - Rutas protegidas con layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"     element={<DashboardPage />} />
              <Route path="/cursos"        element={<CoursesPage />} />
              <Route path="/participantes" element={<ParticipantsPage />} />
              <Route path="/certificados"  element={<CertificatesPage />} />
              <Route path="/emitir"        element={<EmitCertificatePage />} />

              {/* 20.12 - Rutas solo admin */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/dependencias"         element={<DependenciesPage />} />
                <Route path="/admin/plantillas"           element={<TemplatesPage />} />
                <Route path="/admin/usuarios"             element={<UsersPage />} />
                <Route path="/admin/eventos"              element={<GlobalEventsPage />} />
                <Route path="/admin/certificados-global"  element={<GlobalCertificatesPage />} />
                <Route path="/admin/actividad"            element={<ActivityLogPage />} />
                <Route path="/admin/tags"                 element={<TagsPage />} />
                <Route path="/configuracion"              element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* 30.01 - Pagina 404 para rutas no encontradas */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
