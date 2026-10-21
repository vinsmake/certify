// Campos de formulario: Input, Select y Textarea con etiqueta, ayuda y error.
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
  children: (id: string, invalid: boolean) => ReactNode;
}

export const Field = ({ label, hint, error, required, className, children }: FieldProps) => {
  const id = useId();
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
      )}
      {children(id, !!error)}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
};

const controlClass = (invalid: boolean, extra?: string) =>
  ['control', invalid && 'control--invalid', extra].filter(Boolean).join(' ');

interface Common {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  fieldClassName?: string;
}

export const Input = ({
  label,
  hint,
  error,
  fieldClassName,
  className,
  required,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) => (
  <Field label={label} hint={hint} error={error} required={required} className={fieldClassName}>
    {(id, invalid) => <input id={id} required={required} className={controlClass(invalid, className)} {...props} />}
  </Field>
);

export const Textarea = ({
  label,
  hint,
  error,
  fieldClassName,
  className,
  required,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <Field label={label} hint={hint} error={error} required={required} className={fieldClassName}>
    {(id, invalid) => <textarea id={id} required={required} className={controlClass(invalid, className)} {...props} />}
  </Field>
);

export interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends Common, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: Option[];
  /** Texto de la opcion vacia; null para no mostrarla */
  placeholder?: string | null;
}

export const Select = ({
  label,
  hint,
  error,
  fieldClassName,
  className,
  required,
  options,
  placeholder = 'Selecciona una opcion',
  ...props
}: SelectProps) => (
  <Field label={label} hint={hint} error={error} required={required} className={fieldClassName}>
    {(id, invalid) => (
      <select id={id} required={required} className={controlClass(invalid, className)} {...props}>
        {placeholder !== null && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )}
  </Field>
);
