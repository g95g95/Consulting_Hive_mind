import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/app");
  }

  // Find the payment and engagement
  const payment = await db.payment.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      booking: {
        include: {
          engagement: true,
          consultant: true,
        },
      },
    },
  });

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Payment Successful!</CardTitle>
          <CardDescription className="text-slate-400">
            Your consultation has been booked and confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payment?.booking && (
            <div className="p-4 bg-slate-700/30 rounded-lg space-y-2">
              <p className="text-sm text-slate-400">Consultation with</p>
              <p className="text-white font-medium">
                {payment.booking.consultant.firstName} {payment.booking.consultant.lastName}
              </p>
              <p className="text-sm text-slate-400">
                Duration: {payment.booking.duration} minutes
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {payment?.booking?.engagement && (
              <Link href={`/app/engagements/${payment.booking.engagement.id}`}>
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                  Go to Workspace
                </Button>
              </Link>
            )}
            <Link href="/app">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
