Plan: Refresh the preview

1. Send a browser reload command to the active preview viewer via `execute_preview_javascript`.
2. If the reload does not restore the preview (e.g. dev server is stuck), restart the Vite dev server and then reload.
3. Confirm the preview is back online by reading the current route/state.

No file changes or database changes are required.