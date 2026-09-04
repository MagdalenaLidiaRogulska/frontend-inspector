// import { createReactAdapter } from "@frontend-inspector/react-adapter";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { AppLayout } from "./components/layout/AppLayout";
import "./styles/tokens.css";
import "./styles/globals.css";

interface SelectedElement {
  tagName: string;
  id: string;
  className: string;
}

function App() {
  const [isReactDetected, setIsReactDetected] = useState(false);
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    detectReact(setIsReactDetected);
  }, []);

  useEffect(() => {
    const port = chrome.runtime.connect({
      name: "devtools-panel",
    });

    portRef.current = port;

    console.info("[Frontend Inspector] Connected to background.");

    port.postMessage({
      type: "PING_CONTENT_SCRIPT",
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    port.onDisconnect.addListener(() => {
      console.info("[Frontend Inspector] Disconnected from background.");
    });

    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  useEffect(() => {
    const port = portRef.current;

    if (!port) {
      return;
    }

    const handleMessage = (message: {
      type?: string;
      element?: {
        tagName: string;
        id: string;
        className: string;
      };
    }) => {
      if (message.type !== "ELEMENT_SELECTED") {
        return;
      }

      console.info(
        "[Frontend Inspector] Panel received selected element:",
        message.element,
      );

      if (message.element) {
        setSelectedElement(message.element);
      }

      setIsPickerActive(false);
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <AppLayout isReactDetected={isReactDetected}>
      <main>
        <button
          type="button"
          onClick={() => {
            const port = portRef.current;

            if (!port) {
              console.error(
                "[Frontend Inspector] Background connection is not available.",
              );
              return;
            }

            setIsPickerActive(true);

            port.postMessage({
              type: "START_ELEMENT_PICKER",
              tabId: chrome.devtools.inspectedWindow.tabId,
            });
          }}
        >
          {isPickerActive ? "Picking..." : "Pick element"}
        </button>
        {selectedElement && (
          <section>
            <h2>Selected Element</h2>

            <div>
              <strong>{selectedElement.tagName}</strong>
            </div>

            <div>
              <span>id: </span>
              <code>{selectedElement.id || "—"}</code>
            </div>

            <div>
              <span>class: </span>
              <code>{selectedElement.className || "—"}</code>
            </div>
          </section>
        )}
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
