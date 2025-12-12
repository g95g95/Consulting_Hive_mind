"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Lock, CheckCircle, Package } from "lucide-react";

interface TransferPack {
  id: string;
  summary: string | null;
  keyDecisions: string | null;
  runbook: string | null;
  nextSteps: string | null;
  internalizationChecklist: string | null;
  aiGenerated: boolean;
  isFinalized: boolean;
}

interface Engagement {
  id: string;
  status: string;
  agenda: string | null;
  messages: { content: string; authorId: string }[];
  notes: { content: string; title: string | null }[];
  booking: {
    request: {
      title: string;
      refinedSummary: string | null;
      desiredOutcome: string | null;
    } | null;
  };
}

export function TransferPackSection({
  engagementId,
  engagement,
  transferPack,
  isClient,
  isLocked,
}: {
  engagementId: string;
  engagement: Engagement;
  transferPack: TransferPack | null;
  isClient: boolean;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pack, setPack] = useState<TransferPack | null>(transferPack);

  const handleGenerate = async () => {
    if (generating || isLocked) return;

    setGenerating(true);
    try {
      const response = await fetch(`/api/engagements/${engagementId}/transfer-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate transfer pack");
      }

      const result = await response.json();
      setPack(result);
      router.refresh();
    } catch (error) {
      console.error("Generate transfer pack error:", error);
      alert("Failed to generate transfer pack. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!pack || saving || isLocked) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/engagements/${engagementId}/transfer-pack`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pack),
      });

      if (!response.ok) {
        throw new Error("Failed to save transfer pack");
      }

      router.refresh();
    } catch (error) {
      console.error("Save transfer pack error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!pack || saving || isLocked) return;

    if (!confirm("Are you sure you want to finalize the transfer pack? This will complete the engagement.")) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/engagements/${engagementId}/transfer-pack`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pack, isFinalized: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to finalize transfer pack");
      }

      router.refresh();
    } catch (error) {
      console.error("Finalize transfer pack error:", error);
    } finally {
      setSaving(false);
    }
  };

  const updatePack = (field: keyof TransferPack, value: string) => {
    if (!pack) return;
    setPack({ ...pack, [field]: value });
  };

  if (isLocked) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Pack
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <Lock className="h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-500">
              Transfer pack is locked until payment is completed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pack) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Pack
          </CardTitle>
          <CardDescription className="text-slate-400">
            Create a Transfer Pack to document learnings and enable the client to internalize knowledge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-600 rounded-lg text-center">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              The Transfer Pack is mandatory before completing an engagement.
              It contains the summary, key decisions, runbook, and internalization checklist.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Transfer Pack
          </CardTitle>
          <div className="flex items-center gap-2">
            {pack.aiGenerated && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
            {pack.isFinalized && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Finalized
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-slate-400">
          Document the learnings and help the client internalize knowledge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-slate-300">Summary</Label>
          <Textarea
            value={pack.summary || ""}
            onChange={(e) => updatePack("summary", e.target.value)}
            disabled={pack.isFinalized}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            placeholder="Executive summary of the engagement..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Key Decisions</Label>
          <Textarea
            value={pack.keyDecisions || ""}
            onChange={(e) => updatePack("keyDecisions", e.target.value)}
            disabled={pack.isFinalized}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            placeholder="Bullet points of key decisions made..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Runbook / How-To</Label>
          <Textarea
            value={pack.runbook || ""}
            onChange={(e) => updatePack("runbook", e.target.value)}
            disabled={pack.isFinalized}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            placeholder="Step-by-step instructions the client can follow..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Next Steps</Label>
          <Textarea
            value={pack.nextSteps || ""}
            onChange={(e) => updatePack("nextSteps", e.target.value)}
            disabled={pack.isFinalized}
            className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
            placeholder="Recommended next actions..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Internalization Checklist</Label>
          <Textarea
            value={pack.internalizationChecklist || ""}
            onChange={(e) => updatePack("internalizationChecklist", e.target.value)}
            disabled={pack.isFinalized}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            placeholder="Things the client should now be able to do themselves..."
          />
        </div>

        {!pack.isFinalized && (
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Draft"}
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={saving}
              className="ml-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finalize & Complete
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
