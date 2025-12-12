import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, productSKUId } = await request.json();

    // Get booking
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        consultant: true,
        request: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get product SKU
    let productSKU = productSKUId
      ? await db.productSKU.findUnique({ where: { id: productSKUId } })
      : null;

    // If no specific SKU, find one matching duration
    if (!productSKU) {
      productSKU = await db.productSKU.findFirst({
        where: {
          duration: booking.duration,
          type: "SESSION",
          isActive: true,
        },
      });
    }

    if (!productSKU) {
      return NextResponse.json({ error: "No matching product found" }, { status: 400 });
    }

    // Check if already paid
    const existingPayment = await db.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment?.status === "SUCCEEDED") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: productSKU.currency.toLowerCase(),
            product_data: {
              name: productSKU.name,
              description: `${productSKU.duration}-minute consultation with ${booking.consultant.firstName} ${booking.consultant.lastName}`,
            },
            unit_amount: productSKU.priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/checkout/cancel?booking_id=${bookingId}`,
      metadata: {
        bookingId,
        userId: user.id,
        productSKUId: productSKU.id,
      },
      customer_email: user.email,
    });

    // Create or update payment record
    if (existingPayment) {
      await db.payment.update({
        where: { id: existingPayment.id },
        data: {
          stripeSessionId: session.id,
          status: "PENDING",
        },
      });
    } else {
      await db.payment.create({
        data: {
          userId: user.id,
          bookingId,
          productSKUId: productSKU.id,
          amount: productSKU.priceAmount,
          currency: productSKU.currency,
          stripeSessionId: session.id,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
