import { useRef } from "react";
/** Reuse the same key after an uncertain network outcome or duplicate click. */
export function useCommandKey() {
  const keys = useRef(new Map<string, string>());
  return (payload: unknown) => {
    const signature = JSON.stringify(payload);
    let key = keys.current.get(signature);
    if (!key) {
      key = crypto.randomUUID();
      keys.current.set(signature, key);
    }
    return key;
  };
}
