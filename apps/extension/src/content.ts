import type {
  BackgroundMessage,
  ContentMessage,
  ContentPingResponse,
} from "@frontend-inspector/protocol";

console.info("[Frontend Inspector] Content script loaded.");

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
    }
  },
);

function startElementPicker(): void {
  console.info("[Frontend Inspector] Element picker started.");

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    document.removeEventListener("click", handleClick, true);

    console.info("[Frontend Inspector] Element selected:", target);
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

  document.addEventListener("click", handleClick, true);
}
