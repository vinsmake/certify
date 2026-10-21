import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { EmitResponse } from '@certify/shared';
import { certificateApi, courseApi } from '../api';
import { keys } from '../api/keys';
import { useCourseOptions, useTemplates } from '../api/queries';
import { useApiMutation } from '../api/useApiMutation';
import { CERTIFICATE_RELATED } from '../components/certificates/certificateActions';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Field';
import { PageHeader } from '../components/ui/PageHeader';
import { Table } from '../components/ui/Table';

const EmitCertificatePage = () => {
  const [courseId, setCourseId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<EmitResponse | null>(null);

  const courses = useCourseOptions();
  const templates = useTemplates();
  const participants = useQuery({
    queryKey: keys.courses.participants(Number(courseId)),
    queryFn: () => courseApi.participants(Number(courseId)),
    enabled: !!courseId,
  });
  const eligible = (participants.data?.participants ?? []).filter(
    (p) => p.attendance_status === 'completed' && p.certificate?.status !== 'valid',
  );

  const emit = useApiMutation({
    mutationFn: () =>
      certificateApi.emit({
        course_id: Number(courseId),
        participant_ids: [...selected],
        ...(templateId && { template_id: Number(templateId) }),
      }),
    invalidate: CERTIFICATE_RELATED,
    onSuccess: (res) => {
      setResult(res);
      setSelected(new Set());
    },
  });

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="stack">
      <PageHeader title="Emitir certificados" />
      {result && (
        <Alert type={result.errors.length ? 'warning' : 'success'} onClose={() => setResult(null)}>
          Emitidos: {result.emitted.length}. Ya tenian certificado: {result.already_exists.length}. Errores:{' '}
          {result.errors.length}.
        </Alert>
      )}
      <div className="grid-2">
        <Select
          label="Curso"
          value={courseId}
          onChange={(e) => {
            setCourseId(e.target.value);
            setSelected(new Set());
          }}
          options={courses.data ?? []}
          placeholder="Elige un curso..."
        />
        <Select
          label="Plantilla"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          options={(templates.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
          placeholder="La del curso (o la de por defecto)"
        />
      </div>
      {courseId && (
        <>
          <p className="muted">Participantes con asistencia completada y sin certificado valido.</p>
          <Table
            rows={eligible}
            loading={participants.isPending}
            rowKey={(p) => p.participant_id}
            onRowClick={(p) => toggle(p.participant_id)}
            rowClassName={(p) => (selected.has(p.participant_id) ? 'is-selected' : undefined)}
            empty="No hay participantes elegibles en este curso."
            columns={[
              { key: 'check', header: '', render: (p) => <input type="checkbox" readOnly checked={selected.has(p.participant_id)} /> },
              { key: 'name', header: 'Nombre', render: (p) => p.full_name },
              { key: 'dependency', header: 'Dependencia', render: (p) => p.dependency_name ?? 'Invitado' },
            ]}
          />
          <div className="row-end">
            <Button disabled={!selected.size} loading={emit.isPending} onClick={() => emit.mutate()}>
              Emitir {selected.size} certificado(s)
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmitCertificatePage;
