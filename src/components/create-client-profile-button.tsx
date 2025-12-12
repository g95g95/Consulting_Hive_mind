"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateClientProfileButtonProps {
  consultantId?: string;
  className?: string;
}

export function CreateClientProfileButton({ consultantId, className }: CreateClientProfileButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateClientProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success("Client profile created! You can now book consultants.");
        // Redirect to booking page if consultantId provided, otherwise refresh
        if (consultantId) {
          router.push(`/app/requests/new?consultant=${consultantId}`);
        } else {
          router.refresh();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create client profile");
      }
    } catch (error) {
      console.error("Error creating client profile:", error);
      toast.error("Failed to create client profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreateClientProfile}
      disabled={loading}
      className={className || "w-full bg-amber-500 hover:bg-amber-600 text-slate-900"}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Plus className="mr-2 h-4 w-4" />
      )}
      Create Client Profile & Book
    </Button>
  );
}
