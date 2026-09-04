import type {
  BackgroundMessage,
  ContentMessage,
  PanelMessage,
} from "@frontend-inspector/protocol";

console.info("[Frontend Inspector] Background service worker started.");

let devtoolsPort: chrome.runtime.Port | null = null;

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const message: ContentMessage = {
      type: "PING_CONTENT_SCRIPT",
    };

    await chrome.tabs.sendMessage(tabId, message);

    console.info("[Frontend Inspector] Content script is already available.");
  } catch {
    console.info(
      "[Frontend Inspector] Content script not available. Injecting...",
    );

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });

    console.info("[Frontend Inspector] Content script injected successfully.");
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "devtools-panel") {
    return;
  }

  console.info("[Frontend Inspector] DevTools panel connected.");

  devtoolsPort = port;

  port.onMessage.addListener((message: PanelMessage) => {
    console.info("[Frontend Inspector] Background received message:", message);

    if (message.type === "PING_CONTENT_SCRIPT") {
      void ensureContentScript(message.tabId);

      return;
    }

    if (message.type === "START_ELEMENT_PICKER") {
      void ensureContentScript(message.tabId).then(() => {
        const contentMessage: ContentMessage = {
          type: "START_ELEMENT_PICKER",
        };

        void chrome.tabs.sendMessage(message.tabId, contentMessage);
      });

      return;
    }

    if (message.type === "CANCEL_ELEMENT_PICKER") {
      void ensureContentScript(message.tabId).then(() => {
        const contentMessage: ContentMessage = {
          type: "CANCEL_ELEMENT_PICKER",
        };

        void chrome.tabs.sendMessage(message.tabId, contentMessage);
      });

      return;
    }
  });

  port.onDisconnect.addListener(() => {
    console.info("[Frontend Inspector] DevTools panel disconnected.");

    devtoolsPort = null;
  });
});

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender) => {
  if (message.type !== "ELEMENT_SELECTED") {
    return;
  }

  console.info(
    "[Frontend Inspector] Background received selected element:",
    message.element,
    "from tab:",
    sender.tab?.id,
  );

  devtoolsPort?.postMessage(message);
});
