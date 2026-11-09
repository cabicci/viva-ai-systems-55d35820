import { describe, expect, it } from "vitest";
import { coursePasswordMatches, coursePasswordSecret } from "./course-password.server";

describe("course password lock", () => {
  it("locks only the pesticides academic course", () => {
    expect(coursePasswordSecret("academic", "AC-FATE")).toBe("PESTICIDES_COURSE_PASSWORD");
    expect(coursePasswordSecret("academic", "AC-BUS")).toBeUndefined();
    expect(coursePasswordSecret("kids", "AC-FATE")).toBeUndefined();
  });

  it("accepts only the exact password", () => {
    expect(coursePasswordMatches("Secret-123", "Secret-123")).toBe(true);
    expect(coursePasswordMatches("secret-123", "Secret-123")).toBe(false);
    expect(coursePasswordMatches("", "Secret-123")).toBe(false);
  });
});
