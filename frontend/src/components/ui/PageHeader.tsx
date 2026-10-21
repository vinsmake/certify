import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, breadcrumb, actions }: PageHeaderProps) => (
  <div className="page-header">
    <div>
      {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
      <h1>{title}</h1>
      {subtitle && <div className="page-header__subtitle">{subtitle}</div>}
    </div>
    {actions && <div className="row">{actions}</div>}
  </div>
);
