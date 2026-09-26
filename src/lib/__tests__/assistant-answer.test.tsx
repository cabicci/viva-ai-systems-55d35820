import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssistantAnswer } from "@/components/assistant/AssistantAnswer";

describe("assistant answer formatting", () => {
  it("renders emphasis and ordered steps without showing raw markers", () => {
    const { container } = render(
      <AssistantAnswer text={"فكرة بسيطة:\n\n1. **السؤال:** ابدأ\n2. **المراجعة:** عدّل"} />,
    );
    expect(screen.getByText("السؤال:").tagName).toBe("STRONG");
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.textContent).not.toContain("**");
  });

  it("keeps untrusted HTML as plain text", () => {
    const { container } = render(<AssistantAnswer text={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });
});
