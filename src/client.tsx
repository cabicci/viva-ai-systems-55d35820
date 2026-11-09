import "@vitejs/plugin-react/preamble";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

// The preview can serve SSR HTML before the React refresh preamble is injected.
// Load the route tree only after the client-side preamble has executed.
void import("@tanstack/react-start/client").then(({ StartClient }) => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <StartClient />
      </StrictMode>,
    );
  });
});
