// 28.08 - Lista global de cursos/eventos de todas las dependencias (solo admin)

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';

const TYPE_OPTIONS = [
  { value: 'curso',     label: 'Curso'     },
  { value: 'taller',    label: 'Taller'    },
  { value: 'charla',    label: 'Charla'    },
  { value: 'seminario', label: 'Seminario' },
  { value: 'diploma',   label: 'Diploma'   },
];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const columns = [
  { key: 'name',                   label: 'Curso' },
  { key: 'type',                   label: 'Tipo' },
  { key: 'dependency_name',        label: 'Dependencia',    render: (v) => v || '—' },
  { key: 'duration_hours',         label: 'Horas',          render: (v) => v ? `${v}h` : '—' },
  { key: 'instructor',             label: 'Instructor',     render: (v) => v || '—' },
  { key: 'start_date',             label: 'Inicio',         render: (v) => formatDate(v) },
  { key: 'end_date',               label: 'Fin',            render: (v) => formatDate(v) },
  { key: 'participant_count',      label: 'Participantes',  render: (v) => v ?? '—' },
  { key: 'certificates_issued',    label: 'Certificados',   render: (v) => v ?? '—' },
];

const GlobalEventsPage = () => {
  const [data,       setData]       = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/events', { params: { page, limit: LIMIT, type: typeFilter || undefined } })
      .then((r) => { setData(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 style={styles.title}>Eventos Globales</h1>

      <div style={styles.filters}>
        <Select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          options={TYPE_OPTIONS}
          placeholder="Todos los tipos"
          style={{ width: '180px', marginBottom: 0 }}
        />
      </div>

      <Table columns={columns} data={data} loading={loading} emptyText="No hay cursos registrados." />
      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />
    </div>
  );
};

const styles = {
  title:   { fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '1.25rem' },
  filters: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' },
};

export default GlobalEventsPage;
