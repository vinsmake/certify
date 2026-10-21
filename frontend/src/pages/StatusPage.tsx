import { Link } from 'react-router';

const MESSAGES = {
  403: { title: 'Acceso denegado', text: 'No tienes permisos suficientes para acceder a esta seccion.' },
  404: { title: 'Pagina no encontrada', text: 'La ruta que intentas acceder no existe o fue movida.' },
} as const;

/** Paginas de error 403 y 404. */
const StatusPage = ({ code }: { code: keyof typeof MESSAGES }) => (
  <div className="centered-page">
    <div className="card card--narrow stack" style={{ textAlign: 'center' }}>
      <span style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-text-muted)' }}>{code}</span>
      <h1>{MESSAGES[code].title}</h1>
      <p className="muted">{MESSAGES[code].text}</p>
      <Link to="/dashboard" className="btn btn--primary">
        Volver al inicio
      </Link>
    </div>
  </div>
);

export default StatusPage;
