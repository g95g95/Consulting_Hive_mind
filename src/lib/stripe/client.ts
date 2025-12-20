import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

export function getStripeJs() {
  return import("@stripe/stripe-js").then((mod) =>
    mod.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  );
}
