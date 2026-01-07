import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

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
  const isInitialLoad = useRef(true);
  const userTriggeredUpdate = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let registration: ServiceWorkerRegistration | null = null;

    const handleControllerChange = () => {
      if (userTriggeredUpdate.current) {
        console.log('[PWA] User-triggered update, reloading...');
        window.location.reload();
      } else {
        console.log('[PWA] Controller changed (ignoring on initial load)');
      }
    };

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/service-worker.js', {
          updateViaCache: 'none'
        });

        console.log('[PWA] Service worker registered');

        if (registration.waiting && !isInitialLoad.current) {
          console.log('[PWA] Update waiting');
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          console.log('[PWA] Update found');
          const newWorker = registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[PWA] New worker state:', newWorker.state);
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] New version ready - showing update button');
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                } else {
                  console.log('[PWA] First install complete');
                }
              }
            });
          }
        });

        setTimeout(() => {
          isInitialLoad.current = false;
        }, 3000);

        intervalId = setInterval(() => {
          registration?.update().catch(() => {});
        }, 60000);

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    registerSW();

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        registration.update().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const applyUpdate = () => {
    console.log('[PWA] Applying update...');
    userTriggeredUpdate.current = true;
    
    if (waitingWorker) {
      waitingWorker.postMessage('SKIP_WAITING');
    } else {
      console.log('[PWA] No waiting worker, reloading...');
      window.location.reload();
    }
  };

  return (
    <PWAContext.Provider value={{ updateAvailable, applyUpdate }}>
      {children}
    </PWAContext.Provider>
  );
}
