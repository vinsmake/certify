// 27.01-27.11 - Pagina publica de verificacion de certificado (sin layout de admin)

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// 27.07 / 27.08 - URL de logo desde path de storage
const logoUrl = (path) => (path ? `${BACKEND}${path}` : null);

// ---- Sub-componentes ----

const InfoRow = ({ label, value }) =>
  value ? (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  ) : null;

const SectionCard = ({ title, children }) => (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    {children}
  </div>
);

// ---- Pagina principal ----

const VerifyPage = () => {
  // 27.02 - Extraer UUID de la URL
  const { uuid } = useParams();

  const [status,  setStatus]  = useState('loading'); // loading | valid | revoked | not_found | error
  const [data,    setData]    = useState(null);

  // 27.03 - Llamar al endpoint publico al cargar
  useEffect(() => {
    if (!uuid) { setStatus('error'); return; }

    api.get(`/verify/${uuid}`)
      .then((res) => {
        setData(res.data);
        setStatus(res.data.status === 'VALIDO' ? 'valid' : 'revoked');
      })
      .catch((err) => {
        if (err.response?.status === 404) setStatus('not_found');
        else setStatus('error');
      });
  }, [uuid]);

  // ---- Estados de carga / error ----

  if (status === 'loading') {
    return (
      <div style={styles.page}>
        <div style={styles.centered}>
          <p style={styles.loadingText}>Verificando certificado...</p>
        </div>
      </div>
    );
  }

  // 27.06 - No encontrado
  if (status === 'not_found') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.centered}>
          <div style={{ ...styles.statusBanner, ...styles.notFoundBanner }}>
            <span style={styles.statusIcon}>✕</span>
            <div>
              <p style={styles.statusTitle}>CERTIFICADO NO ENCONTRADO</p>
              <p style={styles.statusSub}>El UUID proporcionado no corresponde a ningun certificado emitido.</p>
            </div>
          </div>
          <p style={styles.uuidDisplay}>UUID: {uuid}</p>
        </div>
        <PageFooter />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={styles.page}>
        <Header />
        <div style={styles.centered}>
          <div style={{ ...styles.statusBanner, ...styles.errorBanner }}>
            <span style={styles.statusIcon}>!</span>
            <div>
              <p style={styles.statusTitle}>ERROR DE VERIFICACION</p>
              <p style={styles.statusSub}>No se pudo consultar el estado del certificado. Intenta nuevamente.</p>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>
    );
  }

  // ---- Certificado encontrado (valido o revocado) ----

  const cert    = data.certificate;
  const isValid = status === 'valid';
  const brandingLogo = logoUrl(cert.branding?.logo_path);

  return (
    <div style={styles.page}>
      {/* Header con logo institucional */}
      <header style={styles.header}>
        {brandingLogo && (
          <img
            src={brandingLogo}
            alt="Logo institucional"
            style={styles.headerLogo}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div>
          <p style={styles.headerOrg}>{cert.branding?.organization_name || 'Sistema de Certificados'}</p>
          <p style={styles.headerSub}>Verificacion de Certificado Digital</p>
        </div>
      </header>

      <main style={styles.main}>
        {/* 27.04 / 27.05 - Banner de estado */}
        <div style={{ ...styles.statusBanner, ...(isValid ? styles.validBanner : styles.revokedBanner) }}>
          <span style={styles.statusIcon}>{isValid ? '✓' : '✕'}</span>
          <div>
            {/* 27.04 - VALIDO */}
            {isValid && (
              <>
                <p style={styles.statusTitle}>CERTIFICADO VALIDO</p>
                <p style={styles.statusSub}>Este certificado fue emitido y se encuentra vigente.</p>
              </>
            )}
            {/* 27.05 - REVOCADO */}
            {!isValid && (
              <>
                <p style={styles.statusTitle}>CERTIFICADO REVOCADO</p>
                <p style={styles.statusSub}>
                  Revocado el {formatDate(cert.revoked_at)}.
                  {cert.revocation_reason && ` Motivo: ${cert.revocation_reason}`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* UUID */}
        <p style={styles.uuidDisplay}>UUID: {cert.uuid}</p>

        <div style={styles.grid}>
          {/* 27.09 - Datos del participante */}
          <SectionCard title="Participante">
            <InfoRow label="Nombre"       value={cert.participant?.full_name} />
            <InfoRow label="Cedula"       value={cert.participant?.document_id} />
            <InfoRow label="Organizacion" value={cert.participant?.organization} />
            <InfoRow label="Cargo"        value={cert.participant?.position} />
          </SectionCard>

          {/* 27.09 - Datos del curso */}
          <SectionCard title="Curso / Evento">
            <InfoRow label="Nombre"      value={cert.course?.name} />
            <InfoRow label="Tipo"        value={cert.course?.type} />
            <InfoRow label="Duracion"    value={cert.course?.duration_hours ? `${cert.course.duration_hours} horas` : null} />
            <InfoRow label="Instructor"  value={cert.course?.instructor} />
            <InfoRow label="Inicio"      value={formatDate(cert.course?.start_date)} />
            <InfoRow label="Fin"         value={formatDate(cert.course?.end_date)} />
            <InfoRow label="Fecha emision" value={formatDate(cert.issue_date)} />
          </SectionCard>
        </div>

        {/* 27.08 - Logos de dependencias colaboradoras */}
        {cert.dependencies?.length > 0 && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Dependencias participantes</h3>
            <div style={styles.depsRow}>
              {cert.dependencies
                .sort((a, b) => a.display_order - b.display_order)
                .map((dep, i) => {
                  const depLogo = logoUrl(dep.logo_path);
                  return (
                    <div key={i} style={styles.depItem}>
                      {depLogo && (
                        <img
                          src={depLogo}
                          alt={dep.name}
                          style={styles.depLogo}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span style={styles.depName}>{dep.name}</span>
                      {dep.abbreviation && <span style={styles.depAbbr}>({dep.abbreviation})</span>}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Branding info */}
        <p style={styles.brandingNote}>
          Emitido bajo la version de branding: <strong>{cert.branding?.version_label || '—'}</strong>
        </p>
      </main>

      <PageFooter />
    </div>
  );
};

// ---- Componentes auxiliares ----

const Header = () => (
  <header style={styles.header}>
    <div>
      <p style={styles.headerOrg}>Sistema de Certificados</p>
      <p style={styles.headerSub}>Verificacion de Certificado Digital</p>
    </div>
  </header>
);

const PageFooter = () => (
  <footer style={styles.footer}>
    <p>Este resultado es generado automaticamente por el sistema de certificados digitales.</p>
    <p>Si tienes dudas sobre la autenticidad de este documento, contacta a la institucion emisora.</p>
  </footer>
);

// ---- Estilos (responsivos, sin framework) ----

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    backgroundColor: '#1a365d',
    color: '#fff',
  },
  headerLogo: {
    height: '52px',
    width: 'auto',
    objectFit: 'contain',
    borderRadius: '4px',
    backgroundColor: '#fff',
    padding: '4px',
  },
  headerOrg: {
    margin: 0,
    fontSize: '1.0625rem',
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    margin: 0,
    fontSize: '0.8125rem',
    color: 'rgba(255,255,255,0.75)',
    marginTop: '0.125rem',
  },
  main: {
    flex: 1,
    padding: '1.5rem',
    maxWidth: '860px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  centered: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
  },
  loadingText: {
    fontSize: '1rem',
    color: '#64748b',
  },
  // Banners de estado
  statusBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1.25rem 1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  validBanner: {
    backgroundColor: '#dcfce7',
    border: '1.5px solid #16a34a',
  },
  revokedBanner: {
    backgroundColor: '#fee2e2',
    border: '1.5px solid #dc2626',
  },
  notFoundBanner: {
    backgroundColor: '#fef9c3',
    border: '1.5px solid #ca8a04',
    maxWidth: '600px',
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    border: '1.5px solid #d97706',
    maxWidth: '600px',
  },
  statusIcon: {
    fontSize: '1.75rem',
    fontWeight: '700',
    lineHeight: 1,
    flexShrink: 0,
    marginTop: '0.125rem',
  },
  statusTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '700',
    letterSpacing: '0.03em',
    color: '#0f172a',
  },
  statusSub: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#334155',
    marginTop: '0.25rem',
    lineHeight: '1.5',
  },
  uuidDisplay: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#94a3b8',
    margin: '0 0 1.25rem',
    wordBreak: 'break-all',
  },
  // Grid de tarjetas (2 columnas en desktop, 1 en movil)
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '1.125rem 1.25rem',
    marginBottom: '1rem',
  },
  cardTitle: {
    margin: '0 0 0.875rem',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#1a365d',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.5rem',
  },
  infoRow: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.3125rem 0',
    borderBottom: '1px solid #f1f5f9',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: '0.8125rem',
    color: '#64748b',
    fontWeight: '500',
    minWidth: '110px',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: '0.875rem',
    color: '#0f172a',
    fontWeight: '400',
    flex: 1,
  },
  // Dependencias
  depsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
  },
  depItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.375rem',
    minWidth: '80px',
  },
  depLogo: {
    height: '48px',
    width: 'auto',
    maxWidth: '80px',
    objectFit: 'contain',
    borderRadius: '4px',
  },
  depName: {
    fontSize: '0.75rem',
    color: '#334155',
    fontWeight: '500',
    textAlign: 'center',
  },
  depAbbr: {
    fontSize: '0.6875rem',
    color: '#94a3b8',
    textAlign: 'center',
  },
  brandingNote: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textAlign: 'center',
    margin: '0.5rem 0 1rem',
  },
  footer: {
    padding: '1.25rem 1.5rem',
    backgroundColor: '#1e293b',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
    textAlign: 'center',
    lineHeight: '1.6',
  },
};

export default VerifyPage;
