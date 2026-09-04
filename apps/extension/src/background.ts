console.info("[Frontend Inspector] Background service worker started.");

let devtoolsPort: chrome.runtime.Port | null = null;

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "PING_CONTENT_SCRIPT",
    });

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

  port.onMessage.addListener((message) => {
    console.info("[Frontend Inspector] Background received message:", message);

    if (message?.type === "PING_CONTENT_SCRIPT") {
      const tabId = message.tabId;

      void ensureContentScript(tabId);

      return;
    }

    if (message?.type === "START_ELEMENT_PICKER") {
      const tabId = message.tabId;

      void ensureContentScript(tabId).then(() => {
        chrome.tabs.sendMessage(tabId, {
          type: "START_ELEMENT_PICKER",
        });
      });

      return;
    }
  });

  port.onDisconnect.addListener(() => {
    console.info("[Frontend Inspector] DevTools panel disconnected.");

    devtoolsPort = null;
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "ELEMENT_SELECTED") {
    return;
  }

  console.info(
    "[Frontend Inspector] Background received selected element:",
    message.element,
    "from tab:",
    sender.tab?.id,
  );

  devtoolsPort?.postMessage({
    type: "ELEMENT_SELECTED",
    element: message.element,
  });
});
