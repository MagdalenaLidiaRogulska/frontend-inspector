export type Framework = "react" | "vue" | "angular" | "unknown";

export interface SourceLocation {
  file?: string;
  line?: number;
  column?: number;
}

export interface SourceLocation {
  file?: string;
  line?: number;
  column?: number;
}

export interface HookInfo {
  index: number;
  type: "state" | "ref" | "effect" | "unknown";
  value?: unknown;
  current?: unknown;
  deps?: unknown;
}

export interface ComponentInfo {
  id: string;
  name: string;
  framework: Framework;
  props?: Record<string, unknown>;
  state?: HookInfo[];
  parentId?: string;
  childrenIds?: string[];
  source?: SourceLocation;
}
