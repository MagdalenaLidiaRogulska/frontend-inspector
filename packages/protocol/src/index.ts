export interface SelectedElement {
  tagName: string;
  id: string;
  className: string;
}

export type PanelMessage =
  | {
      type: "PING_CONTENT_SCRIPT";
      tabId: number;
    }
  | {
      type: "START_ELEMENT_PICKER";
      tabId: number;
    };

export type ContentMessage =
  | {
      type: "PING_CONTENT_SCRIPT";
    }
  | {
      type: "START_ELEMENT_PICKER";
    };

export type BackgroundMessage = {
  type: "ELEMENT_SELECTED";
  element: SelectedElement;
};

export interface ContentPingResponse {
  type: "PONG_CONTENT_SCRIPT";
  source: "frontend-inspector-content";
}
