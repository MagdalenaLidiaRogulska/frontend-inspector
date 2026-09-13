import type { ComponentInfo } from "@frontend-inspector/shared";

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
  next?: ReactHook | null;
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

function getComponentState(fiber: ReactFiber): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  let hook = fiber.memoizedState;
  let index = 0;

  while (hook) {
    const value = hook.memoizedState;

    if (isSimpleStateValue(value)) {
      state[`hook-${index}`] = value;
    } else if (isRefValue(value)) {
      state[`hook-${index}`] = {
        current: describeValue(value.current),
      };
    } else {
      state[`hook-${index}`] = "[complex]";
    }

    hook = hook.next ?? null;
    index += 1;
  }

  console.info("[React Adapter] Extracted state:", state);
  return state;
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
