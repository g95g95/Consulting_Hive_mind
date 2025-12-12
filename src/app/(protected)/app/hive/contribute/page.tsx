"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, Layers, Loader2, Info } from "lucide-react";
import Link from "next/link";

export default function ContributePage() {
  const router = useRouter();

  // Common fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Prompt-specific fields
  const [promptText, setPromptText] = useState("");

  // Stack-specific fields
  const [uiTech, setUiTech] = useState("");
  const [backendTech, setBackendTech] = useState("");
  const [databaseTech, setDatabaseTech] = useState("");
  const [releaseTech, setReleaseTech] = useState("");

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

  // Determine contribution type based on filled fields
  const getContributionType = () => {
    const hasPrompt = promptText.trim().length > 0;
    const hasStack = uiTech.trim() || backendTech.trim() || databaseTech.trim() || releaseTech.trim();

    if (hasPrompt && hasStack) return "both";
    if (hasPrompt) return "prompt";
    if (hasStack) return "stack";
    return "pattern"; // Default to pattern if no specific fields filled
  };

  const handleSubmit = async () => {
    if (!title || !content || submitting) return;

    setSubmitting(true);
    try {
      const contributionType = getContributionType();

      // If both prompt and stack are filled, we submit two contributions
      const submissions = [];

      if (contributionType === "both" || contributionType === "prompt") {
        submissions.push(
          fetch("/api/hive/contribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "prompt",
              title: contributionType === "both" ? `${title} (Prompt)` : title,
              description,
              content: promptText || content,
              tags,
            }),
          })
        );
      }

      if (contributionType === "both" || contributionType === "stack") {
        submissions.push(
          fetch("/api/hive/contribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "stack",
              title: contributionType === "both" ? `${title} (Stack)` : title,
              description,
              content,
              tags,
              uiTech,
              backendTech,
              databaseTech,
              releaseTech,
            }),
          })
        );
      }

      if (contributionType === "pattern") {
        submissions.push(
          fetch("/api/hive/contribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "pattern",
              title,
              description,
              content,
              tags,
            }),
          })
        );
      }

      const responses = await Promise.all(submissions);
      const failed = responses.some((r) => !r.ok);

      if (failed) {
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
            Share your knowledge with the community. Fill in the common fields
            and optionally add prompt or stack details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Common Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-300">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Event Sourcing for Audit Logs"
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

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-slate-300">
                Content *
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the pattern, approach, or solution in detail..."
                className="bg-slate-700 border-slate-600 text-white min-h-[150px] font-mono text-sm"
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
          </div>

          {/* Optional Tabs for Prompt and Stack */}
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                Optional: Add prompt or technology stack details
              </span>
            </div>

            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="bg-slate-700 border border-slate-600 w-full grid grid-cols-2">
                <TabsTrigger
                  value="prompt"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Prompt
                </TabsTrigger>
                <TabsTrigger
                  value="stack"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Stack
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="promptText" className="text-slate-300">
                    Prompt Used
                  </Label>
                  <Textarea
                    id="promptText"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Paste the prompt you used (if any)..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[120px] font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Share the AI prompt that helped you achieve this result
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="stack" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="uiTech" className="text-slate-300">
                      UI / Frontend
                    </Label>
                    <Input
                      id="uiTech"
                      value={uiTech}
                      onChange={(e) => setUiTech(e.target.value)}
                      placeholder="e.g., React, Next.js, Vue"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backendTech" className="text-slate-300">
                      Backend
                    </Label>
                    <Input
                      id="backendTech"
                      value={backendTech}
                      onChange={(e) => setBackendTech(e.target.value)}
                      placeholder="e.g., Node.js, Python, Go"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="databaseTech" className="text-slate-300">
                      Database
                    </Label>
                    <Input
                      id="databaseTech"
                      value={databaseTech}
                      onChange={(e) => setDatabaseTech(e.target.value)}
                      placeholder="e.g., PostgreSQL, MongoDB"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="releaseTech" className="text-slate-300">
                      Release / Deployment
                    </Label>
                    <Input
                      id="releaseTech"
                      value={releaseTech}
                      onChange={(e) => setReleaseTech(e.target.value)}
                      placeholder="e.g., Vercel, Docker, K8s"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Describe the technology stack used in your solution
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* TODO: PII Redaction Notice - to be implemented */}
          {/* <div className="p-4 bg-slate-700/30 rounded-lg flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">Automatic Redaction</p>
              <p className="text-sm text-slate-400 mt-1">
                Your contribution will be automatically scanned for PII, secrets,
                and sensitive information before being approved.
              </p>
            </div>
          </div> */}

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
              "Submit Contribution"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
