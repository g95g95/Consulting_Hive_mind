"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function OfferActions({
  requestId,
  userId,
}: {
  requestId: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmitOffer = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit offer");
      }

      router.refresh();
    } catch (error) {
      console.error("Offer error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Add a message to your offer (optional)..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="bg-slate-700 border-slate-600 text-white"
        rows={3}
      />
      <Button
        onClick={handleSubmitOffer}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Offer"
        )}
      </Button>
    </div>
  );
}
