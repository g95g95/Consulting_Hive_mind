"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, BookOpen, Sparkles, Layers, Loader2, Shield } from "lucide-react";
import Link from "next/link";

type ContributionType = "pattern" | "prompt" | "stack";

export default function ContributePage() {
  const router = useRouter();
  const [type, setType] = useState<ContributionType>("pattern");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [useCase, setUseCase] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title || !content || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/hive/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          description,
          content,
          useCase: type === "prompt" ? useCase : undefined,
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit contribution");
      }

      router.push("/app/hive");
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/app/hive"
        className="inline-flex items-center text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Hive Mind
      </Link>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Contribute to the Hive</CardTitle>
          <CardDescription className="text-slate-400">
            Share your knowledge with the community. All contributions go through
            mandatory redaction to remove sensitive information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-3">
            <Label className="text-slate-300">What are you contributing?</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as ContributionType)}
              className="grid grid-cols-3 gap-3"
            >
              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                  type === "pattern"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-600 hover:border-slate-500"
                }`}
              >
                <RadioGroupItem value="pattern" className="sr-only" />
                <BookOpen className="h-6 w-6 text-amber-500" />
                <span className="text-sm text-white">Pattern</span>
              </label>

              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                  type === "prompt"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-600 hover:border-slate-500"
                }`}
              >
                <RadioGroupItem value="prompt" className="sr-only" />
                <Sparkles className="h-6 w-6 text-amber-500" />
                <span className="text-sm text-white">Prompt</span>
              </label>

              <label
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors ${
                  type === "stack"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-slate-600 hover:border-slate-500"
                }`}
              >
                <RadioGroupItem value="stack" className="sr-only" />
                <Layers className="h-6 w-6 text-amber-500" />
                <span className="text-sm text-white">Stack</span>
              </label>
            </RadioGroup>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-300">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "pattern"
                  ? "e.g., Event Sourcing for Audit Logs"
                  : type === "prompt"
                  ? "e.g., Code Review Assistant"
                  : "e.g., Modern SaaS Stack"
              }
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this is and when to use it..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={2}
            />
          </div>

          {/* Use Case (for prompts only) */}
          {type === "prompt" && (
            <div className="space-y-2">
              <Label htmlFor="useCase" className="text-slate-300">
                Use Case
              </Label>
              <Input
                id="useCase"
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                placeholder="e.g., Code review, Documentation, Debugging"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-slate-300">
              Content *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                type === "pattern"
                  ? "Describe the architectural pattern, when to use it, trade-offs..."
                  : type === "prompt"
                  ? "The prompt template..."
                  : "Describe the stack components, why they work together..."
              }
              className="bg-slate-700 border-slate-600 text-white min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-slate-300">Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags..."
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-slate-600 text-slate-300 cursor-pointer hover:bg-slate-700"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Redaction Notice */}
          <div className="p-4 bg-slate-700/30 rounded-lg flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">Automatic Redaction</p>
              <p className="text-sm text-slate-400 mt-1">
                Your contribution will be automatically scanned for PII, secrets,
                and sensitive information before being approved. Names, companies,
                and specific details will be anonymized.
              </p>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!title || !content || submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
