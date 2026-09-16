import type { ComponentInfo, HookInfo } from "@frontend-inspector/shared";

export interface ReactAdapter {
  detect(): boolean;
  inspectElement(element: Element): ComponentInfo | null;
}

interface ReactDevToolsHook {
  renderers?: Map<unknown, unknown>;
}

interface ReactHook {
  memoizedState?: unknown;
  baseState?: unknown;
  baseQueue?: unknown;
  queue?: unknown;
  next?: ReactHook | null;
  tag?: number;
}

interface ReactFiber {
  return?: ReactFiber | null;
  child?: ReactFiber | null;
  sibling?: ReactFiber | null;
  elementType?: unknown;
  type?: unknown;
  stateNode?: unknown;
  memoizedProps?: Record<string, unknown>;
  memoizedState?: ReactHook | null;
  _debugSource?: {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  } | null;
}

function getReactDevToolsHook(): ReactDevToolsHook | undefined {
  const globalObject = globalThis as typeof globalThis & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
  };

  return globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

function findFiberFromElement(element: Element): ReactFiber | null {
  const keys = Object.keys(element);

  const fiberKey = keys.find((key) => key.startsWith("__reactFiber$"));

  if (!fiberKey) {
    return null;
  }

  const fiber = (element as unknown as Record<string, unknown>)[fiberKey];

  if (!fiber || typeof fiber !== "object") {
    return null;
  }

  return fiber as ReactFiber;
}

function getComponentName(fiber: ReactFiber): string | null {
  const type = fiber.elementType ?? fiber.type;

  if (typeof type === "function") {
    return type.name || "Anonymous";
  }

  if (typeof type === "object" && type !== null) {
    const componentType = type as {
      displayName?: unknown;
      render?: {
        name?: unknown;
      };
    };

    if (typeof componentType.displayName === "string") {
      return componentType.displayName;
    }

    if (componentType.render && typeof componentType.render.name === "string") {
      return componentType.render.name;
    }
  }

  return null;
}

function getComponentState(fiber: ReactFiber): HookInfo[] {
  const hooks: HookInfo[] = [];
  let hook = fiber.memoizedState;
  let index = 0;

  while (hook) {
    const value = hook.memoizedState;

    if (hook.queue) {
      hooks.push({
        index,
        type: "state",
        value: describeStateValue(value),
      });
    } else if (isRefValue(value)) {
      hooks.push({
        index,
        type: "ref",
        current: describeValue(value.current),
      });
    } else if (isEffectValue(value)) {
      hooks.push({
        index,
        type: "effect",
        deps: describeEffectDeps(value.deps),
      });
    } else {
      hooks.push({
        index,
        type: "unknown",
      });
    }

    hook = hook.next ?? null;
    index += 1;
  }

  console.info("[React Adapter] Extracted hooks:", hooks);

  return hooks;
}

function isEffectValue(value: unknown): value is { deps?: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "create" in value &&
    "deps" in value
  );
}

function describeEffectDeps(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return describeValue(value);
  }

  return value.map((item) => describeValue(item));
}

function describeValue(value: unknown): unknown {
  if (value === null) {
    return null;
  }

  if (value instanceof Element) {
    return {
      type: "element",
      tagName: value.tagName.toLowerCase(),
    };
  }

  if (typeof value === "object") {
    return `[object: ${value.constructor?.name || "Object"}]`;
  }

  if (typeof value === "function") {
    return `[function: ${value.name || "anonymous"}]`;
  }

  return value;
}

function isSimpleStateValue(
  value: unknown,
): value is null | string | number | boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isRefValue(value: unknown): value is { current: unknown } {
  return typeof value === "object" && value !== null && "current" in value;
}

function serializeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "undefined") {
    return "[undefined]";
  }

  if (typeof value === "bigint") {
    return `[bigint: ${value.toString()}]`;
  }

  if (typeof value === "symbol") {
    return `[symbol: ${value.toString()}]`;
  }

  if (typeof value === "function") {
    return `[function: ${value.name || "anonymous"}]`;
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[circular]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => serializeValue(item, seen));
    }

    const result: Record<string, unknown> = {};

    for (const [key, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = serializeValue(childValue, seen);
    }

    return result;
  }

  return `[${typeof value}]`;
}

function findComponentFiber(fiber: ReactFiber): ReactFiber | null {
  let current: ReactFiber | null | undefined = fiber;

  while (current) {
    const componentName = getComponentName(current);

    if (componentName) {
      return current;
    }

    current = current.return;
  }

  return null;
}

const componentIds = new WeakMap<object, string>();

let nextComponentId = 1;

function createComponentId(fiber: ReactFiber): string {
  const existingId = componentIds.get(fiber);

  if (existingId) {
    return existingId;
  }

  const id = `react-component-${nextComponentId}`;

  nextComponentId += 1;

  componentIds.set(fiber, id);

  return id;
}

function describeComponentType(value: unknown): unknown {
  if (typeof value === "function") {
    const source = Function.prototype.toString.call(value);

    return {
      name: value.name,
      sourceLength: source.length,
      sourceStart: source.slice(0, 500),
      sourceMap: source.match(/\/\/# sourceMappingURL=.*$/m)?.[0] ?? null,
    };
  }

  return value;
}

export function createReactAdapter(): ReactAdapter {
  console.info("[React Adapter] createReactAdapter loaded");
  return {
    detect(): boolean {
      const hook = getReactDevToolsHook();

      return Boolean(hook?.renderers && hook.renderers.size > 0);
    },

    inspectElement(element: Element): ComponentInfo | null {
      console.info("[React Adapter] INSPECT_ELEMENT_TEST_123");
      console.info("[React Adapter] inspectElement called");
      const fiber = findFiberFromElement(element);

      if (!fiber) {
        return null;
      }

      const componentFiber = findComponentFiber(fiber);

      if (!componentFiber) return null;

      const name = getComponentName(componentFiber);

      if (!name) return null;

      console.info("[React Adapter] Component fiber:", componentFiber);
      console.info(
        "[React Adapter] Component source:",
        componentFiber._debugSource,
      );

      console.info(
        "[React Adapter] Component type:",
        describeComponentType(componentFiber.type),
      );

      console.info(
        "[React Adapter] Component elementType:",
        describeComponentType(componentFiber.elementType),
      );

      console.info(
        "[React Adapter] Component memoizedState:",
        componentFiber.memoizedState,
      );

      const state = getComponentState(componentFiber);

      console.info("[React Adapter] Extracted state:", state);

      return {
        id: createComponentId(componentFiber),
        name,
        framework: "react",
        props: componentFiber.memoizedProps ?? {},
        state,
      };
    },
  };
}

function describeStateValue(value: unknown, depth = 0): unknown {
  if (depth > 2) {
    return "[nested]";
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "undefined") {
    return "[undefined]";
  }

  if (typeof value === "function") {
    return `[function: ${value.name || "anonymous"}]`;
  }

  if (typeof value === "symbol") {
    return `[symbol: ${value.toString()}]`;
  }

  if (typeof value === "bigint") {
    return `[bigint: ${value.toString()}]`;
  }

  if (value instanceof Element) {
    return {
      type: "element",
      tagName: value.tagName.toLowerCase(),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => describeStateValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      result[key] = describeStateValue(childValue, depth + 1);
    }

    return result;
  }

  return `[${typeof value}]`;
}
