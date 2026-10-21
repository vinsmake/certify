// Pagina de un curso: todo lo del curso en un solo lugar, organizado en pestañas.
// Flujo: inscribir participantes -> elegir diseño -> generar -> consultar, reimprimir o revocar.
// La pestaña activa vive en la URL (/cursos/:id/:tab) para poder enlazarla.
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, useParams } from 'react-router';
import type { CourseDetail } from '@certify/shared';
import { courseApi } from '../../api';
import { keys } from '../../api/keys';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Spinner } from '../../components/ui/Spinner';
import { courseTypeLabel, formatDate } from '../../lib/format';
import { errorMessage } from '../../lib/http';
import StatusPage from '../StatusPage';
import { CertificatesTab } from './tabs/CertificatesTab';
import { DesignTab } from './tabs/DesignTab';
import { GenerateTab } from './tabs/GenerateTab';
import { InfoTab } from './tabs/InfoTab';
import { ParticipantsTab } from './tabs/ParticipantsTab';

export interface CourseTabProps {
  course: CourseDetail;
}

const TABS = [
  { slug: 'participantes', label: 'Participantes', component: ParticipantsTab },
  { slug: 'diseno', label: 'Diseño', component: DesignTab },
  { slug: 'generar', label: 'Generar', component: GenerateTab },
  { slug: 'certificados', label: 'Certificados', component: CertificatesTab },
  { slug: 'informacion', label: 'Informacion', component: InfoTab },
] as const;

const CoursePage = () => {
  const params = useParams();
  const id = Number(params.id);
  const tab = TABS.find((t) => t.slug === params.tab) ?? TABS[0];

  const { data: course, isPending, error } = useQuery({
    queryKey: keys.courses.detail(id),
    queryFn: () => courseApi.get(id),
    enabled: Number.isInteger(id) && id > 0,
  });

  if (!Number.isInteger(id) || id <= 0) return <StatusPage code={404} />;
  if (isPending) return <Spinner />;
  if (error) return <Alert type="error">{errorMessage(error, 'No se pudo cargar el curso.')}</Alert>;

  const TabComponent = tab.component;

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/cursos">Cursos</Link>}
        title={course.name}
        subtitle={
          <span className="row">
            <Badge>{courseTypeLabel(course.type)}</Badge>
            {course.duration_hours && <span>{course.duration_hours} h</span>}
            {(course.start_date || course.end_date) && (
              <span>
                {formatDate(course.start_date)} - {formatDate(course.end_date)}
              </span>
            )}
            {course.instructor && <span>Instructor: {course.instructor}</span>}
          </span>
        }
      />

      <nav className="tabs">
        {TABS.map((t) => (
          <NavLink key={t.slug} to={`/cursos/${id}/${t.slug}`} className={`tabs__tab${t === tab ? ' active' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <TabComponent course={course} />
    </>
  );
};

export default CoursePage;
