// import { createReactAdapter } from "@frontend-inspector/react-adapter";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { AppLayout } from "./components/layout/AppLayout";
import "./styles/tokens.css";
import "./styles/globals.css";

function App() {
  const [isReactDetected, setIsReactDetected] = useState(false);

  useEffect(() => {
    detectReact(setIsReactDetected);
  }, []);

  return (
    <AppLayout isReactDetected={isReactDetected}>
      <main>
        <h1>Frontend Inspector</h1>
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

function detectReact(callback: (isDetected: boolean) => void): void {
  chrome.devtools.inspectedWindow.eval(
    `Boolean(
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ &&
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers &&
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.size > 0
    )`,
    (result, exceptionInfo) => {
      if (exceptionInfo) {
        console.error(
          "[Frontend Inspector] React detection failed:",
          exceptionInfo,
        );

        callback(false);
        return;
      }

      callback(Boolean(result));
    },
  );
}
