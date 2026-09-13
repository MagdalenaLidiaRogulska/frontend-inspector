import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import type { BackgroundMessage } from "@frontend-inspector/protocol";
import type { ComponentInfo } from "@frontend-inspector/shared";

function App() {
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentInfo | null>(null);

  useEffect(() => {
    const handleMessage = (message: BackgroundMessage) => {
      console.log("[DevTools] Message received:", message);

      if (message.type === "COMPONENT_INSPECTED") {
        console.log(
          "[DevTools] Component received:",
          JSON.stringify(message.component, null, 2),
        );

        if (message.component) {
          setSelectedComponent(message.component);
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  console.log("[DevTools] Render component:", selectedComponent);

  return (
    <main>
      <h1>Frontend Inspector</h1>

      <p>DevTools panel is running.</p>

      {selectedComponent && (
        <section>
          <h2>React Component</h2>

          <div>
            <strong>{selectedComponent.name}</strong>
          </div>

          <div>
            <span>Framework: </span>
            <code>{selectedComponent.framework}</code>
          </div>

          <div>
            <span>Component ID: </span>
            <code>{selectedComponent.id}</code>
          </div>

          <div>
            <h3>Props</h3>
            <pre>{JSON.stringify(selectedComponent.props ?? {}, null, 2)}</pre>
          </div>

          <div>
            <h3>State</h3>
            <pre>{JSON.stringify(selectedComponent.state ?? {}, null, 2)}</pre>
          </div>
        </section>
      )}
    </main>
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
