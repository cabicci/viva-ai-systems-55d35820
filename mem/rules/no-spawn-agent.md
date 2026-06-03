---
name: no-spawn-agent-no-ai-gateway
description: ABSOLUTE BAN — never use spawn_agent or Lovable AI Gateway. User repeated 10+ times.
type: constraint
---
# 🚫 Absolute Ban

User has explicitly repeated **10+ times**:

1. **NEVER** call `spawn_agent` / `acp_subagent--spawn_agent` / `acp_subagent--explore` / `acp_subagent--get_agent_result`.
2. **NEVER** use Lovable AI Gateway (`ai.gateway.lovable.dev`, `LOVABLE_API_KEY` for chat/completions/embeddings/images).

## Why
Both burn credits the user doesn't want to spend. This is a hard product-level constraint, not a preference.

## How to apply
- Codebase research → direct `rg` + parallel `code--view` calls in main loop.
- Web research → `websearch--web_search` directly.
- Multi-step work → batch independent tool calls in parallel; never delegate to sub-agents.
- AI generation (text/image/embeddings) → use the user's own `GEMINI_API_KEY` or `OPENROUTER_API_KEY` via direct `requests` calls in scripts. Never the Lovable gateway.
- If a task seems to "need" a sub-agent or gateway → STOP and tell the user; do not auto-fallback.

## Forbidden tools (do not invoke)
- `acp_subagent--*` (all)
- Any helper that posts to `ai.gateway.lovable.dev`
- The bundled `skill/ai-gateway` script (`/tmp/lovable_ai.py`) — uses LOVABLE_API_KEY
