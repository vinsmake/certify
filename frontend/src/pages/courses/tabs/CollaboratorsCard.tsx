// Dependencias colaboradoras del curso con su logo, firma y firmante EN ESTE CURSO.
// Agregar o quitar colaboradoras es solo del admin (da acceso al curso a otra dependencia).
import { useState } from 'react';
import type { CourseDependency } from '@certify/shared';
import { courseApi } from '../../../api';
import { keys } from '../../../api/keys';
import { useDependencies } from '../../../api/queries';
import { useApiMutation } from '../../../api/useApiMutation';
import { useCurrentUser } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Field';
import { FileButton } from '../../../components/ui/FileButton';
import { StoredImage } from '../../../components/ui/StoredImage';
import { Table } from '../../../components/ui/Table';
import type { CourseTabProps } from '../CoursePage';

type Kind = 'logo' | 'signature';

/** Nombre del firmante: se guarda al salir del campo si cambio. */
const SignerInput = ({ dep, onSave }: { dep: CourseDependency; onSave: (value: string | null) => void }) => {
  const [value, setValue] = useState(dep.signer_name ?? '');
  return (
    <input
      className="control control--sm"
      style={{ width: '100%' }}
      value={value}
      placeholder={dep.dependency_name}
      aria-label={`Firmante de ${dep.dependency_name}`}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const next = value.trim() || null;
        if (next !== (dep.signer_name ?? null)) onSave(next);
      }}
    />
  );
};

export const CollaboratorsCard = ({ course }: CourseTabProps) => {
  const { isAdmin } = useCurrentUser();
  const deps = useDependencies(true, isAdmin);
  const invalidate = [keys.courses.all];

  const add = useApiMutation({
    mutationFn: (dependencyId: number) => courseApi.addDependency(course.id, dependencyId),
    invalidate,
    success: 'Dependencia agregada. Sube su logo y firma para este curso.',
  });
  const remove = useApiMutation({
    mutationFn: (dependencyId: number) => courseApi.removeDependency(course.id, dependencyId),
    invalidate,
    success: 'Dependencia quitada del curso.',
  });
  const setSigner = useApiMutation({
    mutationFn: ({ depId, signer }: { depId: number; signer: string | null }) =>
      courseApi.updateDependency(course.id, depId, { signer_name: signer }),
    invalidate,
    success: 'Firmante actualizado.',
  });
  const uploadFile = useApiMutation({
    mutationFn: ({ depId, kind, file }: { depId: number; kind: Kind; file: File }) =>
      courseApi.uploadDependencyFile(course.id, depId, kind, file),
    invalidate,
    success: (_res, { kind }) => (kind === 'logo' ? 'Logo actualizado.' : 'Firma actualizada.'),
  });
  const deleteFile = useApiMutation({
    mutationFn: ({ depId, kind }: { depId: number; kind: Kind }) => courseApi.deleteDependencyFile(course.id, depId, kind),
    invalidate,
    success: (_res, { kind }) => (kind === 'logo' ? 'Logo quitado.' : 'Firma quitada.'),
  });

  const linked = new Set(course.dependencies.map((d) => d.dependency_id));
  const available = (deps.data ?? []).filter((d) => !linked.has(d.id));

  const fileCell = (d: CourseDependency, kind: Kind) => {
    const path = kind === 'logo' ? d.logo_path : d.signature_path;
    return (
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <StoredImage path={path} alt={kind === 'logo' ? 'Logo' : 'Firma'} />
        <FileButton variant="ghost" onSelect={(file) => uploadFile.mutate({ depId: d.dependency_id, kind, file })}>
          {path ? 'Cambiar' : 'Subir'}
        </FileButton>
        {path && (
          <Button size="sm" variant="ghost" onClick={() => deleteFile.mutate({ depId: d.dependency_id, kind })}>
            Quitar
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="card stack-sm">
      <div className="row-between">
        <h2>Dependencias colaboradoras</h2>
        {isAdmin && available.length > 0 && (
          <Select
            value=""
            onChange={(e) => e.target.value && add.mutate(Number(e.target.value))}
            options={available.map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Agregar dependencia..."
            aria-label="Agregar dependencia colaboradora"
          />
        )}
      </div>
      <p className="small">
        Su logo y la firma de quien firma por ellas aparecen en el certificado. Son propios de este curso.
      </p>
      <Table
        rows={course.dependencies}
        rowKey={(d) => d.dependency_id}
        empty="Sin dependencias colaboradoras."
        columns={[
          { key: 'name', header: 'Dependencia', render: (d) => d.dependency_name },
          { key: 'logo', header: 'Logo', render: (d) => fileCell(d, 'logo') },
          { key: 'signature', header: 'Firma', render: (d) => fileCell(d, 'signature') },
          {
            key: 'signer',
            header: 'Nombre del firmante',
            render: (d) => (
              <SignerInput
                key={`${d.dependency_id}-${d.signer_name ?? ''}`}
                dep={d}
                onSave={(signer) => setSigner.mutate({ depId: d.dependency_id, signer })}
              />
            ),
          },
          ...(isAdmin
            ? [
                {
                  key: 'actions',
                  header: '',
                  render: (d: CourseDependency) => (
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(d.dependency_id)}>
                      Quitar
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  );
};
