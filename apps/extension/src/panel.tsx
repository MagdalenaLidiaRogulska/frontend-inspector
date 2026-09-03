import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppLayout } from "./components/layout/AppLayout";
import "./styles/tokens.css";
import "./styles/globals.css";

function App() {
  return (
    <AppLayout>
      <main>
        <h1>Frontend Inspector</h1>
        <p>DevTools panel is running.</p>
      </main>
    </AppLayout>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
