export type CommandType = "availability" | "hours" | "pause" | "reminder" | "supplier" | "announcement" | "task";
export type CommandStatus = "pending" | "approved" | "rejected" | "completed";

export interface VoiceCommand {
  id: string;
  transcript: string;
  title: string;
  summary: string;
  type: CommandType;
  status: CommandStatus;
  createdAt: string;
  targets: string[];
  confidence: number;
  undoUntil?: string;
  approvalId?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: "Website" | "Calendar" | "CRM" | "Ordering" | "Communication" | "Automation";
  icon: string;
  tint: string;
  description: string;
  connected: boolean;
  account?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  until?: string;
  ordersToday: number;
}
