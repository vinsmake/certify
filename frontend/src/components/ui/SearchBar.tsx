import { useEffect, useState } from 'react';

interface SearchBarProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  /** Milisegundos de espera tras dejar de escribir */
  delay?: number;
}

export const SearchBar = ({ onSearch, placeholder = 'Buscar...', delay = 350 }: SearchBarProps) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value.trim()), delay);
    return () => clearTimeout(timer);
    // onSearch suele ser una funcion nueva en cada render; solo importa el texto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return (
    <div className="search">
      <span className="search__icon" aria-hidden>
        &#9906;
      </span>
      <input
        className="control"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button className="search__clear" onClick={() => setValue('')} aria-label="Limpiar busqueda">
          &times;
        </button>
      )}
    </div>
  );
};
