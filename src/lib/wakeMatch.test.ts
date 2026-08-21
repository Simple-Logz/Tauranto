import { describe, expect, it } from "vitest";
import { findWake } from "./wakeMatch";

describe("findWake", () => {
  it("matches the exact wake phrase", () => {
    const m = findWake("hey tauranto pause online orders until six pm");
    expect(m).not.toBeNull();
    expect("hey tauranto pause online orders until six pm".slice(m!.end).trim()).toBe("pause online orders until six pm");
  });

  it("matches known mis-hears already seen in practice", () => {
    expect(findWake("hey toronto close table four")).not.toBeNull();
    expect(findWake("hey tarantino what's on the schedule")).not.toBeNull();
    expect(findWake("tauranto add a manager")).not.toBeNull();
  });

  it("falls back to fuzzy matching for an unseen mis-hearing", () => {
    // Not in the fixed PHRASES list, but within edit distance 2 of "tauranto".
    const m = findWake("hey turano pause the kitchen");
    expect(m).not.toBeNull();
    expect("hey turano pause the kitchen".slice(m!.end).trim()).toBe("pause the kitchen");
  });

  it("does not fire on ordinary conversation without the brand name", () => {
    expect(findWake("okay let's check on table two and the patio")).toBeNull();
    expect(findWake("we're out of avocados today")).toBeNull();
  });

  it("does not let short unrelated words slip through the fuzzy fallback", () => {
    expect(findWake("go to the auto shop")).toBeNull();
  });
});
