import type { Framework, SourceLocation } from "@frontend-inspector/shared";

export interface ComponentInfo {
  id: string;
  name: string;
  framework: Framework;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  parentId?: string;
  childrenIds?: string[];
  source?: SourceLocation;
}

export interface ProtocolMessage<TPayload = unknown> {
  version: 1;
  type: string;
  payload: TPayload;
}
