// Claves de TanStack Query. Cada dominio comparte prefijo para poder invalidar todo
// lo relacionado con una sola llamada (ej. invalidateQueries({ queryKey: keys.courses.all })).

export const keys = {
  stats: { all: ['stats'] as const },
  courses: {
    all: ['courses'] as const,
    list: (params: object) => ['courses', 'list', params] as const,
    detail: (id: number) => ['courses', id] as const,
    participants: (id: number) => ['courses', id, 'participants'] as const,
    preview: (id: number, draft: object) => ['courses', id, 'preview', draft] as const,
  },
  participants: {
    all: ['participants'] as const,
    list: (params: object) => ['participants', 'list', params] as const,
    certificates: (id: number) => ['participants', id, 'certificates'] as const,
  },
  certificates: {
    all: ['certificates'] as const,
    list: (params: object) => ['certificates', 'list', params] as const,
    detail: (id: number) => ['certificates', id] as const,
  },
  dependencies: { all: ['dependencies'] as const, list: (activeOnly: boolean) => ['dependencies', activeOnly] as const },
  tags: { all: ['tags'] as const },
  templates: { all: ['templates'] as const, detail: (id: number) => ['templates', id] as const },
  users: { all: ['users'] as const },
  admin: {
    events: (params: object) => ['admin', 'events', params] as const,
    certificates: (params: object) => ['admin', 'certificates', params] as const,
    activity: ['admin', 'activity'] as const,
  },
};
