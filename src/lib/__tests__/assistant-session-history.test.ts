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
    appendAssistantTurn("learner-a", "en", turn);
    resetAssistantSession();
    loadAssistantHistory("learner-b", "en");
    expect(getAssistantSession().turns).toEqual([]);
    loadAssistantHistory("learner-a", "en");
    expect(getAssistantSession().turns).toEqual([turn]);
    clearAssistantHistory("learner-a");
    resetAssistantSession();
    loadAssistantHistory("learner-a", "en");
    expect(getAssistantSession().turns).toEqual([]);
  });

  it("keeps each locale's context separate and clears them together", () => {
    appendAssistantTurn("learner-a", "ar-EG", { ...turn, query: "يعني إيه؟" });
    loadAssistantHistory("learner-a", "en");
    expect(getAssistantSession().turns).toEqual([]);
    appendAssistantTurn("learner-a", "en", turn);
    loadAssistantHistory("learner-a", "ar-EG");
    expect(getAssistantSession().turns[0]?.query).toBe("يعني إيه؟");
    clearAssistantHistory("learner-a");
    loadAssistantHistory("learner-a", "en");
    expect(getAssistantSession().turns).toEqual([]);
  });

  it("does not render malformed stored citations", () => {
    localStorage.setItem(
      "masaarat-assistant-history:v2:learner-a:en",
      JSON.stringify([{ query: "x", answer: "y", citations: [null] }]),
    );
    loadAssistantHistory("learner-a", "en");
    expect(getAssistantSession().turns).toEqual([]);
  });
});
