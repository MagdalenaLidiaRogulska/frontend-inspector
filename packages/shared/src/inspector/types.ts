export type Framework = "react" | "vue" | "angular" | "unknown";

export interface ComponentInfo {
  id: string;
  name: string;
  framework: Framework;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  parentId?: string;
  childrenIds?: string[];
}
