/** Browser I/O is forbidden while exercising the isolated client hook. */
export function blockBrowserIO(
  targets = {
    globalObject: globalThis as object,
    storagePrototype: Storage.prototype as object,
  },
) {
  const counts = { network: 0, storage: 0 };
  const installed: string[] = [],
    absent: string[] = [];
  const undo: (() => void)[] = [];
  const restore = () => {
    for (const action of undo.splice(0).reverse()) action();
  };
  function replace(target: object, key: string, kind: keyof typeof counts) {
    const label = `${kind}:${key}`;
    if (!(key in target)) {
      absent.push(label);
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor && !descriptor.configurable) throw new Error(`Cannot block existing ${label}`);
    try {
      Object.defineProperty(target, key, {
        configurable: true,
        writable: true,
        value: function () {
          counts[kind]++;
          throw new Error(`Isolated hook forbids ${kind} I/O`);
        },
      });
    } catch {
      throw new Error(`Cannot block existing ${label}`);
    }
    installed.push(label);
    undo.push(() => {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    });
  }
  try {
    for (const key of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"])
      replace(targets.globalObject, key, "network");
    for (const key of ["getItem", "setItem", "removeItem", "clear", "key"])
      replace(targets.storagePrototype, key, "storage");
  } catch (error) {
    restore();
    throw error;
  }
  return { counts, installed, absent, restore };
}
