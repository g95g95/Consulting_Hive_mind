"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

export function AcceptOfferButton({
  offerId,
  requestId,
}: {
  offerId: string;
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  const handleAction = async (action: "accept" | "decline") => {
    setLoading(action);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} offer`);
      }

      if (action === "accept") {
        const result = await response.json();
        if (result.engagementId) {
          router.push(`/app/engagements/${result.engagementId}`);
          return;
        }
      }

      router.refresh();
    } catch (error) {
      console.error(`${action} error:`, error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleAction("accept")}
        disabled={loading !== null}
        size="sm"
        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
      >
        {loading === "accept" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Check className="mr-1 h-4 w-4" />
            Accept
          </>
        )}
      </Button>
      <Button
        onClick={() => handleAction("decline")}
        disabled={loading !== null}
        size="sm"
        variant="outline"
        className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        {loading === "decline" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <X className="mr-1 h-4 w-4" />
            Decline
          </>
        )}
      </Button>
    </div>
  );
}
