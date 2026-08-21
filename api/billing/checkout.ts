import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import Stripe from "stripe";
import { admin, fail, requireUser } from "../../server/http";

const schema = z.object({ restaurantId: z.string().uuid(), planId: z.enum(["basic", "enterprise"]) });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  try {
    const user = await requireUser(req);
    const body = schema.parse(req.body);
    const db = admin();

    const { data: member } = await db
      .from("restaurant_members")
      .select("role")
      .eq("restaurant_id", body.restaurantId)
      .eq("user_id", user.id)
      .eq("active", true)
      .single();
    if (!member || !["owner", "admin"].includes(member.role)) throw new Error("FORBIDDEN");

    const { data: plan, error: planError } = await db
      .from("plans")
      .select("id,name,monthly_price_cents")
      .eq("id", body.planId)
      .eq("active", true)
      .single();
    if (planError) throw planError;
    if (!plan.monthly_price_cents) throw new Error("PLAN_NOT_PAYABLE");

    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Billing is not configured yet. Set STRIPE_SECRET_KEY in Vercel.");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { data: existingSub } = await db
      .from("restaurant_subscriptions")
      .select("provider_customer_id")
      .eq("restaurant_id", body.restaurantId)
      .maybeSingle();

    let customerId = existingSub?.provider_customer_id || undefined;
    if (!customerId) {
      const { data: restaurant } = await db.from("restaurants").select("name").eq("id", body.restaurantId).single();
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: restaurant?.name || undefined,
        metadata: { restaurantId: body.restaurantId },
      });
      customerId = customer.id;
    }

    const appUrl = (process.env.APP_URL || "http://localhost:8081").replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: body.restaurantId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Tauranto ${plan.name}` },
            unit_amount: plan.monthly_price_cents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: { metadata: { restaurantId: body.restaurantId, planId: body.planId } },
      metadata: { restaurantId: body.restaurantId, planId: body.planId },
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
    });

    if (!session.url) throw new Error("CHECKOUT_SESSION_FAILED");
    return res.json({ checkoutUrl: session.url });
  } catch (error) {
    return fail(res, error);
  }
}
