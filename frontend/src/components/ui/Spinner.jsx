import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const borderSize = size === 'sm' ? '2px' : size === 'lg' ? '4px' : '3px';
  const pxSize = size === 'sm' ? '16px' : size === 'lg' ? '48px' : '32px';

  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: pxSize,
        height: pxSize,
        border: `${borderSize} solid var(--bg-hover)`,
        borderTopColor: 'var(--accent-cool)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}
