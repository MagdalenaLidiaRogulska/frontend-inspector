console.info("[Frontend Inspector] Content script loaded.");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING_CONTENT_SCRIPT") {
    console.info("[Frontend Inspector] Content script received PING.");

    sendResponse({
      type: "PONG_CONTENT_SCRIPT",
      source: "frontend-inspector-content",
    });

    return;
  }

  if (message?.type === "START_ELEMENT_PICKER") {
    startElementPicker();
  }
});

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
    chrome.runtime.sendMessage({
      type: "ELEMENT_SELECTED",
      element: {
        tagName: target.tagName,
        id: target.id,
        className: typeof target.className === "string" ? target.className : "",
      },
    });
  };

  document.addEventListener("click", handleClick, true);
}
