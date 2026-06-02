import React from 'react';

export default function Card({
  children,
  className = '',
  interactive = false,
  onClick,
  ...props
}) {
  const baseClass = 'card';
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`${baseClass} ${interactiveClass} ${className}`.trim()}
      onClick={onClick}
      style={onClick || interactive ? { cursor: 'pointer' } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
