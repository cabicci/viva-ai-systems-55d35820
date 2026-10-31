/** Adapt older adversarial helper fixtures to the owned { reply } contract.
 * This is a transport fixture, not JWT, provider, SDK or runtime evidence.
 * Preserve lazy boundaries so the actual adapter still controls their reads.
 */
export function boxedAssistantFixture(raw: unknown): unknown {
  if (raw instanceof Promise) {
    return Reflect.apply(Promise.prototype.then, raw, [boxedAssistantFixture]);
  }
  if (!raw || (typeof raw !== "object" && typeof raw !== "function"))
    return Object.assign(Object.create(null), { reply: raw });
  return new Proxy(Object.create(null), {
    get(_target, key) {
      if (key === "reply") return raw;
      if (key !== "then") return undefined;
      const then = Reflect.get(raw, "then");
      if (typeof then !== "function") return then;
      return (accept: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        Reflect.apply(then, raw, [(value: unknown) => accept(boxedAssistantFixture(value)), reject]);
    },
  });
}
