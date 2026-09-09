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
