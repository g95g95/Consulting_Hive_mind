import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "paid") {
          const { bookingId, userId, productSKUId } = session.metadata || {};

          if (!bookingId || !userId || !productSKUId) {
            console.error("Missing metadata in session:", session.id);
            break;
          }

          // Idempotency check: skip if already processed
          const existingPayment = await db.payment.findUnique({
            where: { stripeSessionId: session.id },
          });

          if (existingPayment?.status === "SUCCEEDED") {
            console.log(`Webhook already processed for session ${session.id}, skipping`);
            break;
          }

          // Update payment
          const payment = await db.payment.update({
            where: { stripeSessionId: session.id },
            data: {
              status: "SUCCEEDED",
              stripePaymentId: session.payment_intent as string,
            },
          });

          // Check if entitlement already exists (idempotency)
          const existingEntitlement = await db.entitlement.findUnique({
            where: { paymentId: payment.id },
          });

          if (!existingEntitlement) {
            // Create entitlement
            const productSKU = await db.productSKU.findUnique({
              where: { id: productSKUId },
            });

            if (productSKU) {
              let entitlementType: "SESSION_30" | "SESSION_60" | "SESSION_90" | "AUDIT";
              if (productSKU.type === "AUDIT") {
                entitlementType = "AUDIT";
              } else {
                switch (productSKU.duration) {
                  case 30:
                    entitlementType = "SESSION_30";
                    break;
                  case 90:
                    entitlementType = "SESSION_90";
                    break;
                  default:
                    entitlementType = "SESSION_60";
                }
              }

              await db.entitlement.create({
                data: {
                  userId,
                  paymentId: payment.id,
                  type: entitlementType,
                  status: "ACTIVE",
                },
              });
            }
          }

          // Update booking status (idempotent - already CONFIRMED is fine)
          await db.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED" },
          });

          // Audit log
          await db.auditLog.create({
            data: {
              userId,
              action: "PAYMENT_COMPLETED",
              entity: "Payment",
              entityId: payment.id,
              metadata: { bookingId, amount: session.amount_total, stripeEventId: event.id },
            },
          });

          console.log(`Payment completed for booking ${bookingId}`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        await db.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "CANCELLED" },
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await db.payment.updateMany({
          where: { stripePaymentId: paymentIntent.id },
          data: { status: "FAILED" },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
