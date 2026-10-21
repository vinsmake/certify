import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useAuth } from '../../auth/useAuth';
import { APP_TITLE } from '../../config';

interface MenuItem {
  label: string;
  path: string;
}

const MENU: MenuItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Cursos', path: '/cursos' },
  { label: 'Participantes', path: '/participantes' },
  { label: 'Certificados', path: '/certificados' },
  { label: 'Emitir', path: '/emitir' },
];

const ADMIN_MENU: MenuItem[] = [
  { label: 'Dependencias', path: '/admin/dependencias' },
  { label: 'Tags', path: '/admin/tags' },
  { label: 'Plantillas', path: '/admin/plantillas' },
  { label: 'Usuarios', path: '/admin/usuarios' },
  { label: 'Eventos globales', path: '/admin/eventos' },
  { label: 'Certificados global', path: '/admin/certificados-global' },
  { label: 'Actividad', path: '/admin/actividad' },
  { label: 'Configuracion', path: '/configuracion' },
];

const MenuLink = ({ item }: { item: MenuItem }) => (
  <li>
    <NavLink to={item.path} className="app-sidebar__link">
      {item.label}
    </NavLink>
  </li>
);

const Header = () => {
  const { user, isAdmin } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <Link to="/dashboard" className="app-header__brand">
        {APP_TITLE}
      </Link>
      <div className="row">
        <div className="app-header__user">
          <span className="app-header__name">{user.full_name}</span>
          <span className="app-header__dep">{user.dependency_name ?? (isAdmin ? 'Administrador' : '')}</span>
        </div>
        <button
          className="btn btn--secondary btn--sm"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Cerrar sesion
        </button>
      </div>
    </header>
  );
};

const Sidebar = () => {
  const { isAdmin } = useCurrentUser();
  return (
    <aside className="app-sidebar">
      <nav>
        <ul>
          {MENU.map((item) => (
            <MenuLink key={item.path} item={item} />
          ))}
          {isAdmin && (
            <>
              <li className="app-sidebar__divider" />
              <li className="app-sidebar__section">Administracion</li>
              {ADMIN_MENU.map((item) => (
                <MenuLink key={item.path} item={item} />
              ))}
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export const AppLayout = () => (
  <>
    <Header />
    <Sidebar />
    <div className="app-body">
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        {APP_TITLE} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  </>
);
