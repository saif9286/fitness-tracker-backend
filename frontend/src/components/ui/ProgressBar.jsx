import React from 'react';

export default function ProgressBar({
  value = 0,
  target = 100,
  variant = 'cool', // cool, warm, blue, red, purple
  className = '',
}) {
  const percentage = Math.min(Math.max((value / (target || 1)) * 100, 0), 100);

  return (
    <div className={`progress-bar ${className}`.trim()}>
      <div
        className={`progress-bar-fill ${variant}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
