import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle } from "lucide-react";

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string }>;
}) {
  const params = await searchParams;
  const bookingId = params.booking_id;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Payment Cancelled</CardTitle>
          <CardDescription className="text-slate-400">
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400 text-center">
            You can complete the payment at any time from your engagements page.
          </p>

          <div className="flex flex-col gap-2">
            {bookingId && (
              <Link href={`/app/engagements`}>
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                  View Engagements
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
