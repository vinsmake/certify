import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';
import { ToastContainer } from './components/ui/ToastContainer';

// Cada pagina se carga bajo demanda (un chunk por ruta)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CoursesPage = lazy(() => import('./pages/courses/CoursesPage'));
const CoursePage = lazy(() => import('./pages/courses/CoursePage'));
const ParticipantsPage = lazy(() => import('./pages/ParticipantsPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const EmitCertificatePage = lazy(() => import('./pages/EmitCertificatePage'));
const DependenciesPage = lazy(() => import('./pages/admin/DependenciesPage'));
const TagsPage = lazy(() => import('./pages/admin/TagsPage'));
const TemplatesPage = lazy(() => import('./pages/admin/TemplatesPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const GlobalEventsPage = lazy(() => import('./pages/admin/GlobalEventsPage'));
const GlobalCertificatesPage = lazy(() => import('./pages/admin/GlobalCertificatesPage'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

export const App = () => (
  <BrowserRouter>
    <ToastContainer />
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Publicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verificar/:uuid" element={<VerifyPage />} />
        <Route path="/no-autorizado" element={<StatusPage code={403} />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cursos" element={<CoursesPage />} />
            <Route path="/cursos/:id/:tab?" element={<CoursePage />} />
            <Route path="/participantes" element={<ParticipantsPage />} />
            <Route path="/certificados" element={<CertificatesPage />} />
            <Route path="/emitir" element={<EmitCertificatePage />} />

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/admin/dependencias" element={<DependenciesPage />} />
              <Route path="/admin/tags" element={<TagsPage />} />
              <Route path="/admin/plantillas" element={<TemplatesPage />} />
              <Route path="/admin/usuarios" element={<UsersPage />} />
              <Route path="/admin/eventos" element={<GlobalEventsPage />} />
              <Route path="/admin/certificados-global" element={<GlobalCertificatesPage />} />
              <Route path="/admin/actividad" element={<ActivityLogPage />} />
              <Route path="/configuracion" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<StatusPage code={404} />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
