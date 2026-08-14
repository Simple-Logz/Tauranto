import { VoiceCommand, CommandType } from "./models";

const now = () => new Date().toISOString();
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function interpretCommand(raw: string): VoiceCommand {
  const text = raw.trim();
  const lower = text.toLowerCase().replace(/^hey\s+tauranto[,\s]*/i, "");
  let type: CommandType = "task";
  let title = "Create a restaurant task";
  let summary = lower || "Review this captured instruction";
  let targets = ["Operations"];

  if (/sold out|unavailable|ran out|run out|86\b/.test(lower)) {
    type = "availability";
    const item = lower.match(/(?:of|out of|86|mark)\s+(?:the\s+)?([a-z][a-z\s'-]+?)(?:\s+(?:until|for|today|tomorrow)|$)/i)?.[1]?.trim() || "selected menu item";
    const until = lower.match(/(?:until|for)\s+(.+)$/i)?.[1] || "manually restored";
    title = `Mark ${item} unavailable`;
    summary = `Hide from ordering now · restore ${until}`;
    targets = ["Website", "Online ordering", "Menu display"];
  } else if (/close|opening|hours|open at/.test(lower)) {
    type = "hours";
    const time = text.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/i)?.[0] || "the requested time";
    title = "Change restaurant hours";
    summary = `Update operating hours to ${time}`;
    targets = ["Website", "Calendar", "Ordering"];
  } else if (/pause|stop taking|turn off/.test(lower) && /order|delivery|pickup/.test(lower)) {
    type = "pause";
    const duration = text.match(/\d+\s*(?:minutes?|mins?|hours?)/i)?.[0] || "until resumed";
    title = "Pause incoming orders";
    summary = `Stop new online orders for ${duration}`;
    targets = ["Online ordering", "Website"];
  } else if (/supplier|vendor|purchase order|reorder/.test(lower)) {
    type = "supplier";
    title = /call|email|message/.test(lower) ? "Contact a supplier" : "Create supplier request";
    summary = lower.replace(/^remind me to\s*/, "");
    targets = ["Suppliers", /email/.test(lower) ? "Email" : "Tasks"];
  } else if (/remind|calendar|schedule/.test(lower)) {
    type = "reminder";
    title = "Schedule a reminder";
    summary = lower.replace(/^remind me to\s*/, "");
    targets = ["Calendar", "Tasks"];
  } else if (/announce|post|special|website banner/.test(lower)) {
    type = "announcement";
    title = "Publish an announcement";
    summary = lower.replace(/^(announce|post)\s*/, "");
    targets = ["Website", "Social draft"];
  }

  return { id: uid(), transcript: text, title, summary, type, status: "pending", createdAt: now(), targets, confidence: text.length > 12 ? 0.94 : 0.72 };
}
