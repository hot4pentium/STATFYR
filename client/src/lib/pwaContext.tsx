import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAContextType {
  updateAvailable: boolean;
  applyUpdate: () => void;
}

const PWAContext = createContext<PWAContextType>({
  updateAvailable: false,
  applyUpdate: () => {},
});

export function usePWA() {
  return useContext(PWAContext);
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let registration: ServiceWorkerRegistration | null = null;

    const handleControllerChange = () => {
      console.log('[PWA] Controller changed, reloading...');
      window.location.reload();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        console.log('[PWA] Received SW_UPDATED message, version:', event.data.version);
        window.location.reload();
      }
    };

    const checkForUpdate = () => {
      if (registration) {
        console.log('[PWA] Checking for updates...');
        registration.update().catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    const handleFocus = () => {
      checkForUpdate();
    };

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/service-worker.js', {
          updateViaCache: 'none'
        });

        console.log('[PWA] Service worker registered');

        if (registration.waiting) {
          console.log('[PWA] Update waiting, applying immediately...');
          registration.waiting.postMessage('SKIP_WAITING');
        }

        registration.addEventListener('updatefound', () => {
          console.log('[PWA] Update found!');
          const newWorker = registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[PWA] New worker state:', newWorker.state);
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] New version installed, auto-applying update...');
                  newWorker.postMessage('SKIP_WAITING');
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                } else {
                  console.log('[PWA] First install, content cached for offline');
                }
              }
            });
          }
        });

        intervalId = setInterval(() => {
          registration?.update().catch(() => {});
        }, 30000);

        setTimeout(checkForUpdate, 2000);

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    registerSW();

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const applyUpdate = () => {
    if (waitingWorker) {
      console.log('[PWA] Applying update via user action...');
      waitingWorker.postMessage('SKIP_WAITING');
    } else {
      console.log('[PWA] No waiting worker, reloading page...');
      window.location.reload();
    }
  };

  return (
    <PWAContext.Provider value={{ updateAvailable, applyUpdate }}>
      {children}
    </PWAContext.Provider>
  );
}
