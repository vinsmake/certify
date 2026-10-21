import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  block?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => {
  const classes = ['btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading ? 'Procesando...' : children}
    </button>
  );
};
