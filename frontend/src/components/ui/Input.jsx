import React from 'react';

export default function Input({
  label,
  error,
  hint,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {!error && hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}
