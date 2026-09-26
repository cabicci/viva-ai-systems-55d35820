import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { onAuthStateChange: vi.fn() } },
}));

import {
  appendAssistantTurn,
  clearAssistantHistory,
  getAssistantSession,
  loadAssistantHistory,
  resetAssistantSession,
} from "@/lib/assistant-session-store";

const turn = { query: "What next?", answer: "Read the next lesson.", citations: [] };

describe("assistant question history", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAssistantSession();
  });

  it("persists answers per account, restores them, and clears only the selected account", () => {
    appendAssistantTurn("learner-a", turn);
    resetAssistantSession();
    loadAssistantHistory("learner-b");
    expect(getAssistantSession().turns).toEqual([]);
    loadAssistantHistory("learner-a");
    expect(getAssistantSession().turns).toEqual([turn]);
    clearAssistantHistory("learner-a");
    resetAssistantSession();
    loadAssistantHistory("learner-a");
    expect(getAssistantSession().turns).toEqual([]);
  });

  it("does not render malformed stored citations", () => {
    localStorage.setItem(
      "masaarat-assistant-history:learner-a",
      JSON.stringify([{ query: "x", answer: "y", citations: [null] }]),
    );
    loadAssistantHistory("learner-a");
    expect(getAssistantSession().turns).toEqual([]);
  });
});
