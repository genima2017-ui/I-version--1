import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  fullScreenMobile?: boolean;
}

export function Modal({ title, onClose, children, fullScreenMobile = false }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-charcoal-900/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex w-full animate-sheet-in flex-col overflow-hidden border border-fog-300/70 bg-paper-50 shadow-2xl shadow-charcoal-900/10 ${
          fullScreenMobile
            ? 'h-[100dvh] max-h-[100dvh] rounded-none border-0 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:border'
            : 'max-h-[90vh] rounded-t-3xl sm:max-w-lg sm:rounded-2xl'
        }`}
      >
        <div className="flex items-center justify-between border-b border-fog-200 px-6 py-5">
          <h2 id={titleId} className="font-serif text-xl text-charcoal-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-charcoal-500 transition hover:bg-fog-200 hover:text-charcoal-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div
          className={
            fullScreenMobile
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0 sm:block sm:flex-none sm:overflow-y-auto sm:px-6 sm:py-6'
              : 'overflow-y-auto px-6 py-6'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
