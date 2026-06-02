import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const loadingClass = loading ? 'btn-loading' : '';

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" style={{
          width: '1em',
          height: '1em',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginRight: '0.5rem',
          display: 'inline-block'
        }} />
      )}
      {!loading && icon && <span className="btn-icon-left">{icon}</span>}
      <span>{children}</span>
      {!loading && iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
}
