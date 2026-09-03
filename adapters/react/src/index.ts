export interface ReactAdapter {
  detect(): boolean;
}

interface ReactDevToolsHook {
  renderers?: Map<unknown, unknown>;
}

function getReactDevToolsHook(): ReactDevToolsHook | undefined {
  const globalObject = globalThis as typeof globalThis & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook;
  };

  return globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

export function createReactAdapter(): ReactAdapter {
  return {
    detect(): boolean {
      const hook = getReactDevToolsHook();

      return Boolean(hook?.renderers && hook.renderers.size > 0);
    },
  };
}
