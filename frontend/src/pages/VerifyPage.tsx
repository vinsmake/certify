// Pagina publica que abre quien escanea el QR de un certificado.
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { verifyApi } from '../api';
import { Spinner } from '../components/ui/Spinner';
import { StoredImage } from '../components/ui/StoredImage';
import { courseTypeLabel, formatDate } from '../lib/format';
import { httpStatus } from '../lib/http';

const Shell = ({ children, logo, org }: { children: ReactNode; logo?: string | null; org?: string | null }) => (
  <div className="verify">
    <header className="verify__header">
      {logo && <StoredImage path={logo} alt="Logo institucional" className="verify__logo" fallback={null} />}
      <div>
        <p className="verify__org">{org || 'Sistema de Certificados'}</p>
        <p>Verificacion de Certificado Digital</p>
      </div>
    </header>
    <main className="verify__main">{children}</main>
    <footer className="verify__footer">
      <p>Este resultado es generado automaticamente por el sistema de certificados digitales.</p>
      <p>Si tienes dudas sobre la autenticidad de este documento, contacta a la institucion emisora.</p>
    </footer>
  </div>
);

const Banner = ({ tone, icon, title, text }: { tone: string; icon: string; title: string; text: ReactNode }) => (
  <div className={`verify__banner verify__banner--${tone}`}>
    <span className="verify__icon">{icon}</span>
    <div>
      <p className="verify__status">{title}</p>
      <p style={{ color: 'inherit' }}>{text}</p>
    </div>
  </div>
);

const VerifyPage = () => {
  const { uuid = '' } = useParams();
  const { data, isPending, error } = useQuery({ queryKey: ['verify', uuid], queryFn: () => verifyApi.get(uuid), retry: false });

  if (isPending) return <Spinner />;

  if (error) {
    const notFound = httpStatus(error) === 404 || httpStatus(error) === 400;
    return (
      <Shell>
        <Banner
          tone={notFound ? 'invalid' : 'neutral'}
          icon={notFound ? '✕' : '!'}
          title={notFound ? 'CERTIFICADO NO ENCONTRADO' : 'ERROR DE VERIFICACION'}
          text={
            notFound
              ? 'El codigo no corresponde a ningun certificado emitido.'
              : 'No se pudo consultar el estado del certificado. Intenta nuevamente.'
          }
        />
        <p className="mono muted">UUID: {uuid}</p>
      </Shell>
    );
  }

  const cert = data.certificate;
  const valid = data.status === 'VALIDO';
  const course = cert.course;

  return (
    <Shell logo={cert.organization.logo_path} org={cert.organization.name}>
      {valid ? (
        <Banner tone="valid" icon={'✓'} title="CERTIFICADO VALIDO" text="Este certificado fue emitido y se encuentra vigente." />
      ) : (
        <Banner
          tone="invalid"
          icon={'✕'}
          title="CERTIFICADO REVOCADO"
          text={`Revocado el ${formatDate(cert.revoked_at)}.${cert.revocation_reason ? ` Motivo: ${cert.revocation_reason}` : ''}`}
        />
      )}
      <p className="mono muted">UUID: {cert.uuid}</p>

      <div className="grid-2">
        <div className="card">
          <h3 className="card__title">Participante</h3>
          <dl className="dl">
            <dt>Nombre</dt>
            <dd>{cert.participant.full_name}</dd>
          </dl>
        </div>
        <div className="card">
          <h3 className="card__title">Curso / Evento</h3>
          <dl className="dl">
            <dt>Nombre</dt>
            <dd>{course.name}</dd>
            <dt>Tipo</dt>
            <dd>{courseTypeLabel(course.type)}</dd>
            {course.duration_hours && (
              <>
                <dt>Duracion</dt>
                <dd>{course.duration_hours} horas</dd>
              </>
            )}
            {course.instructor && (
              <>
                <dt>Instructor</dt>
                <dd>{course.instructor}</dd>
              </>
            )}
            <dt>Periodo</dt>
            <dd>
              {formatDate(course.start_date)} - {formatDate(course.end_date)}
            </dd>
            <dt>Fecha de emision</dt>
            <dd>{formatDate(cert.issue_date)}</dd>
          </dl>
        </div>
      </div>

      {cert.dependencies.length > 0 && (
        <div className="card">
          <h3 className="card__title">Dependencias participantes</h3>
          <div className="verify__deps">
            {[...cert.dependencies]
              .sort((a, b) => a.display_order - b.display_order)
              .map((dep) => (
                <div key={dep.name} className="verify__dep">
                  {dep.logo_path && <StoredImage path={dep.logo_path} alt={dep.name} className="" fallback={null} />}
                  <span>{dep.name}</span>
                  {dep.abbreviation && <span className="muted">({dep.abbreviation})</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </Shell>
  );
};

export default VerifyPage;
