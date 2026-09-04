export interface ReactAdapter {
  detect(): boolean;
}

interface ReactDevToolsHook {
  renderers?: Map<unknown, unknown>;
}

interface ReactFiber {
  return?: ReactFiber | null;
  child?: ReactFiber | null;
  sibling?: ReactFiber | null;
  elementType?: unknown;
  type?: unknown;
  stateNode?: unknown;
  memoizedProps?: Record<string, unknown>;
  memoizedState?: unknown;
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

export function createReactAdapter(): ReactAdapter {
  return {
    detect(): boolean {
      const hook = getReactDevToolsHook();

      return Boolean(hook?.renderers && hook.renderers.size > 0);
    },
  };
}
