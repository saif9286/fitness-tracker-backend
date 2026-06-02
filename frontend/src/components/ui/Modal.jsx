import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '480px',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          {title && <h3 className="text-h3" style={{ fontWeight: 'var(--weight-semibold)' }}>{title}</h3>}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ marginLeft: 'auto', width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ marginBottom: footer ? 'var(--space-6)' : '0' }}>
          {children}
        </div>
        {footer && (
          <div className="modal-footer" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-primary)'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
