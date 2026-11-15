import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  fullScreen?: boolean;
  fullScreenMobile?: boolean;
  smoothViewport?: boolean;
}

export function Modal({
  title,
  onClose,
  children,
  fullScreen = false,
  fullScreenMobile = false,
  smoothViewport = false,
}: ModalProps) {
  const titleId = useId();
  const modalRootRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!fullScreen || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const syncToVisualViewport = () => {
      const root = modalRootRef.current;
      if (!root) return;
      root.style.top = `${viewport.offsetTop}px`;
      root.style.height = `${viewport.height}px`;
    };

    syncToVisualViewport();
    viewport.addEventListener('resize', syncToVisualViewport);
    viewport.addEventListener('scroll', syncToVisualViewport);

    return () => {
      viewport.removeEventListener('resize', syncToVisualViewport);
      viewport.removeEventListener('scroll', syncToVisualViewport);
    };
  }, [fullScreen]);

  return createPortal(
    <div
      ref={modalRootRef}
      className={`fixed inset-x-0 top-0 z-50 box-border flex w-full max-w-full justify-center overflow-hidden ${
        smoothViewport ? 'chat-viewport-transition' : ''
      } ${
        fullScreen ? 'items-stretch' : 'items-end sm:items-center sm:p-6'
      }`}
    >
      <div
        className={`absolute inset-0 animate-fade-in bg-charcoal-900/15 backdrop-blur-[6px] ${
          fullScreen ? 'hidden' : ''
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative box-border flex w-full max-w-full min-w-0 flex-col overflow-hidden ${
          fullScreen
            ? 'h-full max-h-full animate-fade-in rounded-none border-0 bg-white shadow-none'
            : `liquid-surface liquid-modal animate-sheet-in border border-white/70 ${
                fullScreenMobile
            ? 'h-[100dvh] max-h-[100dvh] rounded-none border-0 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:border'
            : 'max-h-[90vh] rounded-t-3xl sm:max-w-lg sm:rounded-2xl'
              }`
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-6 py-5 ${
            fullScreen
              ? 'border-fog-200 bg-white'
              : 'border-white/65 bg-white/25 backdrop-blur-xl'
          }`}
        >
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
            fullScreen
              ? 'box-border flex w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white px-0 py-0'
              : fullScreenMobile
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0 sm:block sm:flex-none sm:overflow-y-auto sm:px-6 sm:py-6'
              : 'overflow-y-auto px-6 py-6'
          }
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
