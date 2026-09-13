import type {
  BackgroundMessage,
  PanelMessage,
  SelectedElement,
} from "@frontend-inspector/protocol";
import type { ComponentInfo } from "@frontend-inspector/shared";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { AppLayout } from "./components/layout/AppLayout";
import "./styles/tokens.css";
import "./styles/globals.css";

// import { createReactAdapter } from "@frontend-inspector/react-adapter";

function App() {
  const [isReactDetected, setIsReactDetected] = useState(false);
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null);
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentInfo | null>(null);

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

    const message: PanelMessage = {
      type: "PING_CONTENT_SCRIPT",
      tabId: chrome.devtools.inspectedWindow.tabId,
    };

    port.postMessage(message);

    port.onDisconnect.addListener(() => {
      console.info("[Frontend Inspector] Disconnected from background.");

      if (portRef.current === port) {
        portRef.current = null;
      }
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

    const handleMessage = (message: BackgroundMessage) => {
      if (message.type === "ELEMENT_SELECTED") {
        console.info(
          "[Frontend Inspector] Panel received selected element:",
          message.element,
        );

        setSelectedElement(message.element);
        setIsPickerActive(false);

        return;
      }

      if (message.type === "COMPONENT_INSPECTED") {
        console.info(
          "[Frontend Inspector] Panel received component:",
          message.component,
        );

        setSelectedComponent(message.component);

        return;
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!isPickerActive) {
        return;
      }

      const port = portRef.current;

      if (!port) {
        setIsPickerActive(false);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      console.info("[Frontend Inspector] Cancelling element picker.");

      const message: PanelMessage = {
        type: "CANCEL_ELEMENT_PICKER",
        tabId: chrome.devtools.inspectedWindow.tabId,
      };

      port.postMessage(message);

      setIsPickerActive(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isPickerActive]);

  const handleStartPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    const port = portRef.current;

    if (!port) {
      console.error(
        "[Frontend Inspector] Background connection is not available.",
      );

      return;
    }

    event.currentTarget.blur();

    setIsPickerActive(true);

    const message: PanelMessage = {
      type: "START_ELEMENT_PICKER",
      tabId: chrome.devtools.inspectedWindow.tabId,
    };

    port.postMessage(message);
  };

  return (
    <AppLayout isReactDetected={isReactDetected}>
      <main>
        <button type="button" onClick={handleStartPicker}>
          {isPickerActive ? "Picking..." : "Pick element"}
        </button>

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

              <pre>
                {JSON.stringify(selectedComponent.props ?? {}, null, 2)}
              </pre>
            </div>

            <div>
              <h3>Hooks</h3>

              {selectedComponent.state?.length ? (
                <div>
                  {selectedComponent.state.map((hook) => (
                    <div key={hook.index}>
                      <strong>
                        {hook.type === "state"
                          ? "useState"
                          : hook.type === "ref"
                            ? "useRef"
                            : hook.type === "effect"
                              ? "useEffect"
                              : "Unknown"}
                      </strong>

                      <span> #{hook.index}</span>

                      {hook.type === "state" && (
                        <pre>{JSON.stringify(hook.value, null, 2)}</pre>
                      )}

                      {hook.type === "ref" && (
                        <pre>{JSON.stringify(hook.current, null, 2)}</pre>
                      )}

                      {hook.type === "effect" && (
                        <pre>{JSON.stringify(hook.deps, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hooks detected.</p>
              )}
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
