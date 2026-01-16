"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Contribution {
  id: string;
  title: string;
  description?: string;
  content: string;
  tags: string[];
  createdAt: string;
  creator: { firstName: string | null; lastName: string | null; email: string };
  redactionJob?: {
    detectedPII: string[];
    detectedSecrets: string[];
    status: string;
  } | null;
}

interface ModerationData {
  patterns: Contribution[];
  prompts: Contribution[];
  stacks: Contribution[];
}

export function ModerationQueue() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      toast.error("Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (type: string, id: string, action: "approve" | "reject") => {
    setProcessing(`${type}-${id}`);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      });

      if (res.ok) {
        toast.success(`Contribution ${action}d successfully`);
        fetchQueue();
      } else {
        const error = await res.json();
        toast.error(error.error || "Action failed");
      }
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("Failed to process action");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const allItems = [
    ...data.patterns.map(p => ({ ...p, type: "pattern" as const })),
    ...data.prompts.map(p => ({ ...p, type: "prompt" as const })),
    ...data.stacks.map(p => ({ ...p, type: "stack" as const })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (allItems.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8">
        No contributions pending review
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {allItems.map((item) => (
        <Card key={`${item.type}-${item.id}`} className="bg-slate-700/30 border-slate-600">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-slate-500 text-slate-300">
                    {item.type}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    by {item.creator.firstName || item.creator.email}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                  onClick={() => handleAction(item.type, item.id, "approve")}
                  disabled={processing === `${item.type}-${item.id}`}
                >
                  {processing === `${item.type}-${item.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="ml-1">Approve</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => handleAction(item.type, item.id, "reject")}
                  disabled={processing === `${item.type}-${item.id}`}
                >
                  <X className="h-4 w-4" />
                  <span className="ml-1">Reject</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {item.redactionJob && (item.redactionJob.detectedPII.length > 0 || item.redactionJob.detectedSecrets.length > 0) && (
              <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Redaction detected: {item.redactionJob.detectedPII.length} PII, {item.redactionJob.detectedSecrets.length} secrets
                  </span>
                </div>
              </div>
            )}
            <div className="text-sm text-slate-300 max-h-32 overflow-y-auto bg-slate-800/50 p-3 rounded">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {item.content.slice(0, 500)}{item.content.length > 500 && "..."}
              </pre>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
