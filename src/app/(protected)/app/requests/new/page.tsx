"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

type Urgency = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface RequestData {
  title: string;
  rawDescription: string;
  refinedSummary: string;
  constraints: string;
  desiredOutcome: string;
  suggestedDuration: number;
  urgency: Urgency;
  budget: string;
  selectedSkills: string[];
  sensitiveData: boolean;
  isPublic: boolean;
}

const URGENCY_OPTIONS = [
  { value: "LOW", label: "Low", description: "Flexible timing" },
  { value: "NORMAL", label: "Normal", description: "Within a week" },
  { value: "HIGH", label: "High", description: "Within days" },
  { value: "URGENT", label: "Urgent", description: "ASAP" },
];

const DURATION_OPTIONS = [
  { value: 30, label: "30 min", price: "€75" },
  { value: 60, label: "60 min", price: "€140" },
  { value: 90, label: "90 min", price: "€195" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const directConsultantId = searchParams.get("consultant");

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [data, setData] = useState<RequestData>({
    title: "",
    rawDescription: "",
    refinedSummary: "",
    constraints: "",
    desiredOutcome: "",
    suggestedDuration: 60,
    urgency: "NORMAL",
    budget: "",
    selectedSkills: [],
    sensitiveData: false,
    isPublic: !directConsultantId,
  });

  const updateData = (updates: Partial<RequestData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleRefine = async () => {
    if (!data.rawDescription.trim()) return;

    setRefining(true);
    try {
      const response = await fetch("/api/ai/refine-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: data.rawDescription }),
      });

      if (response.ok) {
        const result = await response.json();
        updateData({
          refinedSummary: result.summary,
          constraints: result.constraints,
          desiredOutcome: result.desiredOutcome,
          suggestedDuration: result.suggestedDuration,
          selectedSkills: result.suggestedSkills,
          sensitiveData: result.sensitiveDataWarning,
        });
      } else if (response.status === 429) {
        alert("AI service is busy. Please wait a few seconds and try again.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to refine request. Please try again.");
      }
    } catch (error) {
      console.error("Refine error:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setRefining(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          consultantId: directConsultantId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create request");
      }

      const result = await response.json();
      router.push(`/app/requests/${result.id}`);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            {directConsultantId ? "Book a Consultation" : "Create a Request"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Step {step} of {totalSteps}
          </CardDescription>
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-amber-500" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Describe your problem */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-300">
                  Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Need help setting up RAG pipeline"
                  value={data.title}
                  onChange={(e) => updateData({ title: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rawDescription" className="text-slate-300">
                  Describe your problem or question *
                </Label>
                <Textarea
                  id="rawDescription"
                  placeholder="Don't worry about being perfectly organized - just describe what you're trying to accomplish, what you've tried, and where you're stuck. Our AI will help structure this."
                  value={data.rawDescription}
                  onChange={(e) => updateData({ rawDescription: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white min-h-[200px]"
                />
                <p className="text-xs text-slate-500">
                  Be as detailed as you like. Include technical context, constraints, and what
                  success looks like.
                </p>
              </div>

              <Button
                onClick={handleRefine}
                disabled={!data.rawDescription.trim() || refining}
                variant="outline"
                className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              >
                {refining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Let AI help structure this
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Review and refine */}
          {step === 2 && (
            <div className="space-y-6">
              {data.sensitiveData && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      Sensitive Data Detected
                    </p>
                    <p className="text-xs text-amber-300/80 mt-1">
                      Your request may involve sensitive data. Be careful not to share actual
                      credentials, PII, or confidential information in the description.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refinedSummary" className="text-slate-300">
                  Summary
                </Label>
                <Textarea
                  id="refinedSummary"
                  value={data.refinedSummary}
                  onChange={(e) => updateData({ refinedSummary: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints" className="text-slate-300">
                  Constraints
                </Label>
                <Textarea
                  id="constraints"
                  placeholder="Technical, budget, or time constraints..."
                  value={data.constraints}
                  onChange={(e) => updateData({ constraints: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredOutcome" className="text-slate-300">
                  Desired Outcome
                </Label>
                <Textarea
                  id="desiredOutcome"
                  placeholder="What does success look like?"
                  value={data.desiredOutcome}
                  onChange={(e) => updateData({ desiredOutcome: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Suggested Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {data.selectedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="default"
                      className="bg-amber-500 text-slate-900"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {data.selectedSkills.length === 0 && (
                    <p className="text-sm text-slate-500">No skills suggested yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Duration and preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">Session Duration</Label>
                <div className="grid grid-cols-3 gap-3">
                  {DURATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateData({ suggestedDuration: option.value })}
                      className={`p-4 rounded-lg border text-center transition-colors ${
                        data.suggestedDuration === option.value
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-sm text-slate-400">{option.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300">Urgency</Label>
                <RadioGroup
                  value={data.urgency}
                  onValueChange={(value) => updateData({ urgency: value as Urgency })}
                  className="grid grid-cols-2 gap-3"
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        data.urgency === option.value
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      <RadioGroupItem value={option.value} />
                      <div>
                        <p className="font-medium text-white">{option.label}</p>
                        <p className="text-xs text-slate-400">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-slate-300">
                  Budget (optional)
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="EUR"
                  value={data.budget}
                  onChange={(e) => updateData({ budget: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {!directConsultantId && (
                <div className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Your request will be published
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Available consultants will be able to see and respond to your request.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && (!data.title || !data.rawDescription)) ||
                  (step === 2 && !data.refinedSummary)
                }
                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create Request <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
