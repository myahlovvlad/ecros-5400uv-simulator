import { describe, expect, it } from "vitest";
import {
  SCREEN_CANONICAL_INDEX,
  SCREEN_FLOW_EDGES,
  SCREEN_INDEX,
  SCREEN_REGISTRY,
  getScreenMeta,
  getScreenTransitions,
  isKnownScreen,
  validateScreenRegistryForTests,
} from "../../src/domain/constants/screens.js";
import { SCREEN_HANDLER_REGISTRY } from "../../src/presentation/hooks/useDeviceController.js";

describe("screen registry", () => {
  it("passes structural validation", () => {
    expect(validateScreenRegistryForTests()).toBe(true);
  });

  it("contains metadata for every legacy WND screen", () => {
    Object.keys(SCREEN_INDEX).forEach((screenId) => {
      expect(SCREEN_REGISTRY[screenId]).toBeTruthy();
      expect(getScreenMeta(screenId)?.legacyWnd).toBe(SCREEN_INDEX[screenId]);
      expect(getScreenMeta(screenId)?.canonicalId).toBe(SCREEN_CANONICAL_INDEX[screenId]);
    });
  });

  it("has canonical ids and source integrity for every screen", () => {
    Object.values(SCREEN_REGISTRY).forEach((screen) => {
      expect(screen.canonicalId).toMatch(/^[A-Z]+(?:-[A-Z]+)+$/);
      expect(["implemented", "partial", "missing", "runtime-only"]).toContain(screen.implementationStatus);
      expect(["reindexed", "merged", "ambiguous", "runtime-only"]).toContain(screen.sourceIntegrity);
    });
  });

  it("keeps all flow edge endpoints inside the canonical registry", () => {
    SCREEN_FLOW_EDGES.forEach(([from, to]) => {
      expect(isKnownScreen(from)).toBe(true);
      expect(isKnownScreen(to)).toBe(true);
    });
  });

  it("covers all implemented screen handlers", () => {
    Object.keys(SCREEN_HANDLER_REGISTRY).forEach((screenId) => {
      expect(SCREEN_REGISTRY[screenId]).toBeTruthy();
    });
  });

  it("contains normalized entries for the four documented screen-map modes", () => {
    const modes = new Set(Object.values(SCREEN_REGISTRY).map((screen) => screen.mode));

    expect(modes.has("photometry")).toBe(true);
    expect(modes.has("quantitative")).toBe(true);
    expect(modes.has("kinetics")).toBe(true);
    expect(modes.has("settings")).toBe(true);
  });

  it("stores repeated source screen ids as metadata, not canonical keys", () => {
    const canonicalIds = Object.keys(SCREEN_REGISTRY);
    const repeatedSourceIds = ["1-4", "1-6-1", "1-6-1-1-27"];

    repeatedSourceIds.forEach((sourceId) => {
      expect(canonicalIds).not.toContain(sourceId);
      expect(Object.values(SCREEN_CANONICAL_INDEX)).not.toContain(sourceId);
      expect(
        Object.values(SCREEN_REGISTRY).some((screen) => screen.sourceScreenIds.includes(sourceId)),
      ).toBe(true);
    });
  });

  it("exposes transition metadata through helper functions", () => {
    expect(getScreenTransitions("main")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "enter", target: "photometry" }),
        expect.objectContaining({ action: "enter", target: "quantMain" }),
        expect.objectContaining({ action: "enter", target: "kineticsMenu" }),
        expect.objectContaining({ action: "enter", target: "settings" }),
      ]),
    );
  });
});
