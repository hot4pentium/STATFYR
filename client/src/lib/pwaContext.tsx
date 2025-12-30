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

    const handleControllerChange = () => {
      // Only reload if the main service worker changed, not the Firebase messaging worker
      const controller = navigator.serviceWorker.controller;
      if (controller && controller.scriptURL.includes('service-worker.js')) {
        window.location.reload();
      }
    };

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');

        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          }
        });

        intervalId = setInterval(() => {
          registration.update().catch(() => {});
        }, 60000);

      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerSW();

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage('SKIP_WAITING');
    }
  };

  return (
    <PWAContext.Provider value={{ updateAvailable, applyUpdate }}>
      {children}
    </PWAContext.Provider>
  );
}
