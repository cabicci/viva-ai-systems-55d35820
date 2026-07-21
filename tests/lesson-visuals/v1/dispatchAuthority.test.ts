import { describe, expect, it } from "vitest";
import {
  DEFAULT_FIXTURE_DISPATCH_ACTORS,
  parseDispatchActorAllowlist,
  validateDispatchAuthorization,
} from "../../../src/lib/lesson-visuals/v1/dispatch/authorizationContract";

const VALID_SHA = "1041fae1a6db81c1cfdcb4f7904850df418b93b3";
const VALID_MANIFEST_SHA =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const base = {
  controlRoomAuthorizationId: "CR-2026-07-20-INTEGRATION-001",
  approvedSourceSha: VALID_SHA,
  approvedManifestSha256: VALID_MANIFEST_SHA,
  runMode: "full" as const,
  dispatchActor: "lovable",
  githubActor: "lovable",
  actualSourceSha: VALID_SHA,
  actualManifestSha256: VALID_MANIFEST_SHA,
  allowedDispatchActors: DEFAULT_FIXTURE_DISPATCH_ACTORS,
};

describe("dispatch authorization (Lovable-only, fail-closed)", () => {
  it("authorized Lovable routing PASSES", () => {
    const r = validateDispatchAuthorization(base);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("missing CR id FAILS", () => {
    const r = validateDispatchAuthorization({
      ...base,
      controlRoomAuthorizationId: "",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/controlRoomAuthorizationId/);
  });

  it("wrong manifest sha FAILS", () => {
    const r = validateDispatchAuthorization({
      ...base,
      actualManifestSha256:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/AUTHORIZED_MANIFEST/);
  });

  it("dispatch_actor=cursor FAILS", () => {
    const r = validateDispatchAuthorization({
      ...base,
      dispatchActor: "cursor",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ").toLowerCase()).toMatch(/cursor|not authorized|banned/);
  });

  it("dispatch_actor=cli FAILS", () => {
    const r = validateDispatchAuthorization({
      ...base,
      dispatchActor: "cli",
    });
    expect(r.ok).toBe(false);
  });

  it("empty actor FAILS", () => {
    const r = validateDispatchAuthorization({
      ...base,
      dispatchActor: "",
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/empty/i);
  });

  it("github-ui-style unauthorized actor FAILS", () => {
    const r = validateDispatchAuthorization({
      ...base,
      dispatchActor: "github-ui",
      githubActor: "github-ui",
    });
    expect(r.ok).toBe(false);
  });

  it("empty allowlist fails closed", () => {
    const r = validateDispatchAuthorization({
      ...base,
      allowedDispatchActors: [],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/allowlist is empty/);
  });

  it("parseDispatchActorAllowlist splits configured actors", () => {
    expect(parseDispatchActorAllowlist("lovable, other-bot")).toEqual([
      "lovable",
      "other-bot",
    ]);
    expect(parseDispatchActorAllowlist("")).toEqual([]);
  });
});
