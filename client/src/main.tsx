import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Remove splash screen when React mounts
const splashScreen = document.getElementById('splash-screen');
if (splashScreen) {
  splashScreen.remove();
}

createRoot(document.getElementById("root")!).render(<App />);
