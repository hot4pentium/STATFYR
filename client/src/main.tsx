import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Helper function to remove splash screen
function removeSplashScreen() {
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    splashScreen.remove();
  }
}

// Failsafe: Remove splash screen after 5 seconds no matter what
// This prevents the app from appearing stuck if React fails to mount
const splashTimeout = setTimeout(() => {
  console.warn('[Main] Failsafe timeout: removing splash screen');
  removeSplashScreen();
}, 5000);

try {
  // Remove splash screen when React mounts
  removeSplashScreen();
  clearTimeout(splashTimeout);
  
  createRoot(document.getElementById("root")!).render(<App />);
} catch (error) {
  console.error('[Main] React bootstrap failed:', error);
  // Ensure splash is removed even if React fails
  removeSplashScreen();
  clearTimeout(splashTimeout);
  throw error; // Re-throw to allow debugging
}
