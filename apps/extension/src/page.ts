import { createReactAdapter } from "@frontend-inspector/react-adapter";

interface InspectElementRequest {
  source: "frontend-inspector-content";
  type: "INSPECT_ELEMENT";
  inspectorId: string;
}

interface InspectElementResponse {
  source: "frontend-inspector-page";
  type: "COMPONENT_INSPECTED";
  inspectorId: string;
  component: unknown;
}

const reactAdapter = createReactAdapter();

// console.info("[Frontend Inspector] Page bridge loaded.");
console.info("[Frontend Inspector] PAGE_TS_TEST_123");

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) {
    return;
  }

  const data = event.data as Partial<InspectElementRequest> | null;

  if (
    !data ||
    data.source !== "frontend-inspector-content" ||
    data.type !== "INSPECT_ELEMENT" ||
    typeof data.inspectorId !== "string"
  ) {
    return;
  }

  const element = document.querySelector(
    `[data-frontend-inspector-id="${CSS.escape(data.inspectorId)}"]`,
  );

  if (!(element instanceof Element)) {
    sendResponse(data.inspectorId, null);
    return;
  }

  console.info("[Frontend Inspector] Calling React adapter:", element);

  const component = reactAdapter.inspectElement(element);

  console.info("[Frontend Inspector] Adapter returned:", component);

  sendResponse(data.inspectorId, component);

  sendResponse(data.inspectorId, component);
});

function sendResponse(inspectorId: string, component: unknown): void {
  const response: InspectElementResponse = {
    source: "frontend-inspector-page",
    type: "COMPONENT_INSPECTED",
    inspectorId,
    component,
  };

  window.postMessage(response, "*");
}
