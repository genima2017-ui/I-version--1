import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const requestedUpdateRef = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

    let active = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;

    const showWaitingUpdate = () => {
      if (active && registration?.waiting && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }
    };
    const handleWorkerState = () => {
      if (installingWorker?.state === 'installed') showWaitingUpdate();
    };
    const handleUpdateFound = () => {
      installingWorker?.removeEventListener('statechange', handleWorkerState);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener('statechange', handleWorkerState);
      handleWorkerState();
    };
    const handleControllerChange = () => {
      if (requestedUpdateRef.current) window.location.reload();
    };
    const checkForUpdates = () => {
      if (document.visibilityState === 'visible') {
        void registration?.update().catch((error: unknown) => {
          console.error('[PWA] update check failed', error);
        });
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', checkForUpdates);
    const updateInterval = window.setInterval(checkForUpdates, 60 * 60 * 1000);

    void navigator.serviceWorker.register('/sw.js').then((registered) => {
      if (!active) return;
      registration = registered;
      registrationRef.current = registered;
      registered.addEventListener('updatefound', handleUpdateFound);
      if (registered.installing) handleUpdateFound();
      showWaitingUpdate();
      checkForUpdates();
    }).catch((error: unknown) => {
      console.error('[PWA] service worker registration failed', error);
    });

    return () => {
      active = false;
      registration?.removeEventListener('updatefound', handleUpdateFound);
      installingWorker?.removeEventListener('statechange', handleWorkerState);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', checkForUpdates);
      window.clearInterval(updateInterval);
      registrationRef.current = null;
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 flex justify-center lg:bottom-6" role="status">
      <button
        type="button"
        disabled={updating}
        onClick={() => {
          const waiting = registrationRef.current?.waiting;
          if (!waiting) {
            setUpdateAvailable(false);
            return;
          }
          requestedUpdateRef.current = true;
          setUpdating(true);
          waiting.postMessage({ type: 'SKIP_WAITING' });
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-fog-300 bg-paper-50 px-4 py-3 text-sm font-medium text-charcoal-800 shadow-md transition hover:bg-white disabled:opacity-70"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {updating ? '正在更新…' : '发现新版本，点击更新'}
      </button>
    </div>
  );
}