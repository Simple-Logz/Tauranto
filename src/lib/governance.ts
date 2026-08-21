// Single source of truth for the things Tauranto's governance layer needs to
// agree on across the AI (server/agent.ts), the impact planner
// (server/operations.ts), the API (api/account/policy.ts), and the Settings
// UI (src/screens/SettingsPanel.tsx). Keeping this in one plain, dependency-free
// module (no react-native, no node-only APIs) means it can be imported by
// both the Expo client bundle and the Vercel server functions.

export const ACTION_INTENTS = [
  "menu_availability",
  "business_hours",
  "pause_orders",
  "supplier_email",
  "purchase_request",
  "contact_message",
  "calendar_reminder",
  "schedule_meeting",
  "update_meeting",
  "cancel_meeting",
  "send_email",
  "crm_contact_create",
  "crm_contact_update",
  "crm_note",
  "crm_task",
  "square_catalog_update",
  "square_order",
  "toast_menu_update",
  "toast_order_action",
  "zoom_meeting",
  "customer_followup",
  "announcement",
  "internal_task",
  "website_update",
] as const;
export type ActionIntent = (typeof ACTION_INTENTS)[number];

export const ACTION_LABELS: Record<ActionIntent, string> = {
  menu_availability: "Menu item availability",
  business_hours: "Business hours changes",
  pause_orders: "Pause online ordering",
  supplier_email: "Supplier emails",
  purchase_request: "Purchase / supply orders",
  contact_message: "Message a directory contact",
  calendar_reminder: "Reminders & tasks",
  schedule_meeting: "Schedule a meeting",
  update_meeting: "Update a meeting",
  cancel_meeting: "Cancel a meeting",
  send_email: "Send email",
  crm_contact_create: "Create CRM contact",
  crm_contact_update: "Update CRM contact",
  crm_note: "Add CRM note",
  crm_task: "Create CRM task",
  square_catalog_update: "Update Square catalog",
  square_order: "Square order actions",
  toast_menu_update: "Update Toast menu",
  toast_order_action: "Toast order actions",
  zoom_meeting: "Create Zoom meeting",
  customer_followup: "Customer follow-up",
  announcement: "Team announcement",
  internal_task: "Internal task",
  website_update: "Website update",
};

export const MEMBER_ROLES = ["owner", "admin", "manager", "operator", "server", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  operator: "Operator",
  server: "Server",
  viewer: "Viewer",
};

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

// A restaurant's operation_policies.role_max_risk overrides these; this is
// only the fallback used when a restaurant hasn't configured its own values
// (or for a role that's missing from an older policy row).
export const DEFAULT_ROLE_MAX_RISK: Record<MemberRole, RiskLevel> = {
  owner: "critical",
  admin: "critical",
  manager: "high",
  operator: "medium",
  server: "low",
  viewer: "low",
};
