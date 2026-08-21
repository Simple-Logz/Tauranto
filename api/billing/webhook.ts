import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { admin } from "../../server/http";
import { captureError } from "../../server/monitoring";

// Stripe requires the exact raw request bytes to verify a webhook signature,
// so Vercel's normal JSON body parsing must be disabled for this route.
export const config = { api: { bodyParser: false } };

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Recent Stripe API versions moved current_period_end off Subscription and
// onto each SubscriptionItem (a subscription can have multiple items on
// different billing cycles). Tauranto only ever creates one item per
// subscription (see api/billing/checkout.ts), so the first item's period end
// is the subscription's period end for our purposes.
function periodEnd(sub: Stripe.Subscription): string | null {
  const end = sub.items.data[0]?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

function mapStatus(status: Stripe.Subscription.Status): "trialing" | "active" | "past_due" | "cancelled" {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "canceled" || status === "incomplete_expired") return "cancelled";
  // past_due, unpaid, incomplete, paused: something needs attention, but the
  // subscription isn't confirmed dead yet.
  return "past_due";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];
  if (!process.env.STRIPE_SECRET_KEY || !secret || !signature) {
    return res.status(400).json({ error: "STRIPE_WEBHOOK_NOT_CONFIGURED" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, signature as string, secret);
  } catch (e) {
    console.error("Stripe webhook signature verification failed", e);
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  const db = admin();
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const restaurantId = session.client_reference_id || session.metadata?.restaurantId;
      const planId = session.metadata?.planId;
      if (restaurantId && planId) {
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        let status: "trialing" | "active" | "past_due" | "cancelled" = "active";
        let currentPeriodEnd: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status = mapStatus(sub.status);
          currentPeriodEnd = periodEnd(sub);
        }
        await db.from("restaurant_subscriptions").upsert(
          {
            restaurant_id: restaurantId,
            plan_id: planId,
            status,
            provider: "stripe",
            provider_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
            provider_subscription_id: subscriptionId || null,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "restaurant_id" },
        );
        await db.from("audit_events").insert({
          restaurant_id: restaurantId,
          event: "stripe_checkout_completed",
          metadata: { planId, subscriptionId },
        });
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const restaurantId = sub.metadata?.restaurantId;
      const status = event.type === "customer.subscription.deleted" ? "cancelled" : mapStatus(sub.status);
      const update = {
        status,
        current_period_end: periodEnd(sub),
        updated_at: new Date().toISOString(),
      };
      if (restaurantId) {
        await db.from("restaurant_subscriptions").update(update).eq("restaurant_id", restaurantId);
      } else {
        // Metadata should always carry restaurantId (set at checkout time),
        // but fall back to matching on the Stripe subscription id in case an
        // older subscription predates that metadata being set.
        await db.from("restaurant_subscriptions").update(update).eq("provider_subscription_id", sub.id);
      }
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("Stripe webhook handling failed", e);
    captureError(e, { path: "/api/billing/webhook", stripeEvent: event.type });
    return res.status(500).json({ error: "WEBHOOK_HANDLING_FAILED" });
  }
}
