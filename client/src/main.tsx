import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function hideSplashScreen() {
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    splashScreen.style.opacity = '0';
    splashScreen.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => splashScreen.remove(), 300);
  }
}

window.hideSplashScreen = hideSplashScreen;

// Failsafe: remove splash screen after 3 seconds no matter what
// This ensures the app is never stuck on splash screen
setTimeout(() => {
  console.warn('[Main] Failsafe timeout: removing splash screen');
  hideSplashScreen();
}, 3000);

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error('[Main] React bootstrap failed:', error);
  hideSplashScreen();
  throw error;
}

declare global {
  interface Window {
    hideSplashScreen: () => void;
  }
}
