import React from 'react';

export default function ProgressRing({
  value = 0,
  target = 100,
  size = 120,
  strokeWidth = 8,
  color = 'var(--accent-cool)',
  backgroundColor = 'var(--border-primary)',
  label = '',
  unit = '',
  fontSizeValue = 'var(--text-xl)',
  fontSizeLabel = 'var(--text-xs)',
  className = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / (target || 1)) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`progress-ring-container ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Foreground Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-in-out',
          }}
        />
      </svg>
      {/* Inner Label content */}
      <div
        className="progress-ring-content"
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <span
          className="text-mono"
          style={{
            fontSize: fontSizeValue,
            fontWeight: 'var(--weight-semibold)',
            lineHeight: 1,
          }}
        >
          {Math.round(value)}
          {unit && <span style={{ fontSize: '0.6em', marginLeft: '1px' }}>{unit}</span>}
        </span>
        {label && (
          <span
            className="text-label"
            style={{
              fontSize: fontSizeLabel,
              color: 'var(--text-secondary)',
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
