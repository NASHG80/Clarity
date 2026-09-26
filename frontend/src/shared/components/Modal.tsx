import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full: 'sm:max-w-[calc(100%-2rem)]',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#26382D]/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      {/* Modal Panel */}
      <div
        ref={modalRef}
        className={`relative w-full bg-[#F8F6F3] rounded-2xl shadow-2xl flex flex-col max-h-[100dvh] overflow-hidden ${maxWidthClasses[maxWidth]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D8C9BE]/50">
          <h2 id="modal-title" className="text-lg font-serif font-medium text-[#26382D]">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="ml-4 -mr-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#D8C9BE]/50 bg-[#F1EDE9]/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
