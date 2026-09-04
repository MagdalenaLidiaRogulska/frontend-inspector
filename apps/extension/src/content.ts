import type {
  BackgroundMessage,
  ContentMessage,
  ContentPingResponse,
} from "@frontend-inspector/protocol";

console.info("[Frontend Inspector] Content script loaded.");

let cancelActivePicker: (() => void) | null = null;

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse) => {
    if (message.type === "PING_CONTENT_SCRIPT") {
      console.info("[Frontend Inspector] Content script received PING.");

      const response: ContentPingResponse = {
        type: "PONG_CONTENT_SCRIPT",
        source: "frontend-inspector-content",
      };

      sendResponse(response);

      return;
    }

    if (message.type === "START_ELEMENT_PICKER") {
      startElementPicker();
      return;
    }

    if (message.type === "CANCEL_ELEMENT_PICKER") {
      console.info("[Frontend Inspector] Element picker cancelled.");

      cancelActivePicker?.();
    }
  },
);

function startElementPicker(): void {
  cancelActivePicker?.();

  console.info("[Frontend Inspector] Element picker started.");

  const highlightStyle = document.createElement("style");

  highlightStyle.textContent = `
    [data-frontend-inspector-highlight="true"] {
      outline: 2px solid #569cd6 !important;
      outline-offset: -2px !important;
      cursor: crosshair !important;
    }
  `;

  document.documentElement.appendChild(highlightStyle);

  let highlightedElement: Element | null = null;
  let isActive = true;

  const clearHighlight = () => {
    if (!highlightedElement) {
      return;
    }

    highlightedElement.removeAttribute("data-frontend-inspector-highlight");

    highlightedElement = null;
  };

  const highlightElement = (element: Element) => {
    if (!isActive || highlightedElement === element) {
      return;
    }

    clearHighlight();

    element.setAttribute("data-frontend-inspector-highlight", "true");

    highlightedElement = element;
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isActive) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      clearHighlight();
      return;
    }

    highlightElement(target);
  };

  const cleanup = () => {
    if (!isActive) {
      return;
    }

    isActive = false;

    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("keydown", handleKeyDown, true);

    clearHighlight();
    highlightStyle.remove();

    cancelActivePicker = null;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !isActive) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.info("[Frontend Inspector] Element picker cancelled.");

    cleanup();
  };

  const handleClick = (event: MouseEvent) => {
    if (!isActive) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    console.info("[Frontend Inspector] Element selected:", target);

    cleanup();

    const message: BackgroundMessage = {
      type: "ELEMENT_SELECTED",
      element: {
        tagName: target.tagName,
        id: target.id,
        className: typeof target.className === "string" ? target.className : "",
      },
    };

    chrome.runtime.sendMessage(message);
  };

  cancelActivePicker = cleanup;

  document.addEventListener("mousemove", handleMouseMove, true);
  document.addEventListener("click", handleClick, true);
  document.addEventListener("keydown", handleKeyDown, true);
}
