import { describe, expect, it } from "vitest";
import { buildImpactPlan, requiredApprovals, validateProposal } from "./operations";

function baseProposal(overrides: Partial<Record<string, any>> = {}) {
  return {
    action_type: "menu_availability",
    confidence: 0.9,
    ambiguities: [],
    parameters: { item: "Salmon" },
    ...overrides,
  };
}

describe("validateProposal", () => {
  it("accepts a well-formed, high-confidence proposal with a required field present", () => {
    const result = validateProposal(baseProposal());
    expect(result.valid).toBe(true);
    expect(result.problems).toHaveLength(0);
  });

  it("rejects an action type that isn't in the supported set", () => {
    const result = validateProposal(baseProposal({ action_type: "delete_restaurant" }));
    expect(result.valid).toBe(false);
    expect(result.problems).toContain("This action is not enabled for execution yet.");
  });

  it("rejects low-confidence proposals below the 0.75 threshold", () => {
    const result = validateProposal(baseProposal({ confidence: 0.5 }));
    expect(result.valid).toBe(false);
    expect(result.problems.some((p) => /not confident enough/i.test(p))).toBe(true);
  });

  it("requires a menu item for menu_availability", () => {
    const result = validateProposal(baseProposal({ parameters: {} }));
    expect(result.valid).toBe(false);
    expect(result.problems).toContain("Menu item is required.");
  });

  it("requires an email, item, and quantity for purchase_request", () => {
    const result = validateProposal(
      baseProposal({ action_type: "purchase_request", parameters: {} }),
    );
    expect(result.problems).toEqual(
      expect.arrayContaining([
        "The vendor must have an email address in the Operations Directory.",
        "Purchase item is required.",
        "Purchase quantity is required.",
      ]),
    );
  });

  it("blocks outbound phone calls for contact_message, since only SMS/email are enabled", () => {
    const result = validateProposal(
      baseProposal({ action_type: "contact_message", parameters: { channel: "call" } }),
    );
    expect(result.problems).toContain("Outbound phone calls are not enabled yet. Use SMS or email.");
  });
});

describe("buildImpactPlan", () => {
  it("only plans against providers that are actually connected", () => {
    const integrations = [{ provider: "toast", status: "connected" }];
    const plan = buildImpactPlan(baseProposal(), integrations);
    expect(plan.map((p) => p.provider)).toEqual(["toast"]);
  });

  it("always includes 'staff' and 'website'-independent channels marked always=true (e.g. email fallback)", () => {
    const plan = buildImpactPlan(
      baseProposal({ action_type: "send_email", parameters: { recipient_email: "a@b.com" } }),
      [],
    );
    // No gmail connected -> falls back to the always-available 'email' provider.
    expect(plan.some((p) => p.provider === "email")).toBe(true);
  });

  it("prefers gmail over the generic email fallback when gmail is connected", () => {
    const plan = buildImpactPlan(
      baseProposal({ action_type: "send_email", parameters: { recipient_email: "a@b.com" } }),
      [{ provider: "gmail", status: "connected" }],
    );
    expect(plan.some((p) => p.provider === "gmail")).toBe(true);
    expect(plan.some((p) => p.provider === "email")).toBe(false);
  });

  it("never plans a square action, even when a square integration shows as connected", () => {
    // Square OAuth connect works (see IntegrationsScreen), but execution is
    // not built — buildImpactPlan must exclude it regardless of connection
    // status so the app fails honestly (via validateProposal's "no
    // configured delivery channel" message) instead of silently accepting a
    // command it can't carry out.
    const integrations = [{ provider: "square", status: "connected" }];
    const menuPlan = buildImpactPlan(baseProposal(), integrations);
    expect(menuPlan.some((p) => p.provider === "square")).toBe(false);
    expect(menuPlan).toHaveLength(0);

    const orderPlan = buildImpactPlan(
      baseProposal({ action_type: "square_order", parameters: {} }),
      integrations,
    );
    expect(orderPlan).toHaveLength(0);
  });
});

describe("requiredApprovals", () => {
  it("requires at least 2 approvals for critical risk regardless of policy", () => {
    expect(requiredApprovals("critical", {})).toBe(2);
    expect(requiredApprovals("critical", { critical_approvals: 1 })).toBe(2);
    expect(requiredApprovals("critical", { critical_approvals: 3 })).toBe(3);
  });

  it("requires at least 1 approval for high and medium risk", () => {
    expect(requiredApprovals("high", {})).toBe(1);
    expect(requiredApprovals("medium", {})).toBe(1);
  });

  it("requires 1 approval for low risk by default, and 0 only when the policy opts in to auto-execute", () => {
    expect(requiredApprovals("low", {})).toBe(1);
    expect(requiredApprovals("low", { auto_execute_low_risk: true })).toBe(0);
  });
});
