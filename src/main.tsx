import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Export ReactDOM for use in certificate generation utility
export { createRoot };

createRoot(document.getElementById("root")!).render(<App />);