import OpenAI from "openai";
import { z } from "zod";

export const proposalSchema = z.object({
  action_type: z.enum(["menu_availability", "business_hours", "pause_orders", "supplier_email", "purchase_request", "calendar_reminder", "customer_followup", "announcement", "internal_task", "unknown"]),
  title: z.string().min(1), summary: z.string().min(1),
  parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  risk: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  ambiguities: z.array(z.string()), confirmation_question: z.string().nullable(),
});

export async function interpretWithAI(transcript: string, restaurantContext: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: process.env.OPENAI_ACTION_MODEL || "gpt-5.4",
    instructions: `You are Tauranto, a restaurant operations command interpreter. Convert speech into ONE proposed action. Never execute. Preserve quantities, units, dates, names and money exactly. If a value is unclear, list it as an ambiguity and ask a short confirmation question. Purchasing, publishing, messaging, hours, ordering and menu changes are at least medium risk. Purchase quantities or money are high risk. Restaurant context:\n${restaurantContext}`,
    input: transcript,
    text: { format: zodTextFormat(proposalSchema, "restaurant_action") },
  });
  if (!response.output_parsed) throw new Error("AI_RETURNED_NO_ACTION");
  return proposalSchema.parse(response.output_parsed);
}

function zodTextFormat(schema: typeof proposalSchema, name: string) {
  // Kept local so the server bundle has one audited schema boundary.
  const json = { type: "object", additionalProperties: false, required: ["action_type","title","summary","parameters","risk","confidence","ambiguities","confirmation_question"], properties: {
    action_type:{type:"string",enum:["menu_availability","business_hours","pause_orders","supplier_email","purchase_request","calendar_reminder","customer_followup","announcement","internal_task","unknown"]}, title:{type:"string"}, summary:{type:"string"}, parameters:{type:"object",additionalProperties:{type:["string","number","boolean","null"]}}, risk:{type:"string",enum:["low","medium","high","critical"]}, confidence:{type:"number",minimum:0,maximum:1}, ambiguities:{type:"array",items:{type:"string"}}, confirmation_question:{type:["string","null"]}
  }};
  return { type: "json_schema" as const, name, strict: true, schema: json };
}
