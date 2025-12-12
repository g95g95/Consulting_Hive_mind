"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Hexagon, Briefcase, Users, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

type Role = "CLIENT" | "CONSULTANT" | "BOTH";

interface OnboardingData {
  role: Role | null;
  // Consultant fields
  headline: string;
  bio: string;
  hourlyRate: string;
  languages: string[];
  timezone: string;
  linkedinUrl: string;
  yearsExperience: string;
  selectedSkills: string[];
  consentDirectory: boolean;
  consentHiveMind: boolean;
  // Client fields
  companyName: string;
  companyRole: string;
  billingEmail: string;
}

const AVAILABLE_SKILLS = [
  "Large Language Models", "Machine Learning", "MLOps", "RAG Systems", "AI Agents",
  "Prompt Engineering", "Data Engineering", "Data Science", "Analytics",
  "Cloud Architecture", "AWS", "GCP", "Azure", "Kubernetes", "DevOps",
  "Security Architecture", "Backend Development", "Frontend Development",
  "Full-Stack Development", "API Design", "System Design", "Product Architecture",
  "Technical Strategy", "ERP Integration", "Legacy Modernization"
];

const LANGUAGES = ["English", "Italian", "German", "French", "Spanish", "Portuguese", "Dutch", "Polish", "Chinese", "Japanese"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    role: null,
    headline: "",
    bio: "",
    hourlyRate: "",
    languages: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    linkedinUrl: "",
    yearsExperience: "",
    selectedSkills: [],
    consentDirectory: true,
    consentHiveMind: false,
    companyName: "",
    companyRole: "",
    billingEmail: "",
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      router.push("/app");
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return data.role !== null;
    if (step === 2 && (data.role === "CONSULTANT" || data.role === "BOTH")) {
      return data.headline && data.selectedSkills.length > 0;
    }
    if (step === 2 && data.role === "CLIENT") {
      return true; // Client profile is optional at first
    }
    if (step === 3) return true;
    return true;
  };

  const totalSteps = data.role === "BOTH" ? 4 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Hexagon className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl text-white">Welcome to the Hive</CardTitle>
          <CardDescription className="text-slate-400">
            Step {step} of {totalSteps} &mdash; Let&apos;s set up your profile
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
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">How will you use Hive Mind?</h3>
              <RadioGroup
                value={data.role || ""}
                onValueChange={(value) => updateData({ role: value as Role })}
                className="grid gap-4"
              >
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    data.role === "CLIENT"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <RadioGroupItem value="CLIENT" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-white">I need expert help</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Find and book consultations with experts in AI, engineering, and technology.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    data.role === "CONSULTANT"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <RadioGroupItem value="CONSULTANT" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-white">I offer consulting</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Share your expertise through paid consultations and contribute to the hive.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    data.role === "BOTH"
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <RadioGroupItem value="BOTH" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Hexagon className="h-5 w-5 text-amber-500" />
                      <span className="font-medium text-white">Both</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      I want to both seek help and offer my expertise.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Consultant Profile (if CONSULTANT or BOTH) */}
          {step === 2 && (data.role === "CONSULTANT" || data.role === "BOTH") && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Your Consultant Profile</h3>

              <div className="space-y-2">
                <Label htmlFor="headline" className="text-slate-300">Professional Headline *</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Senior ML Engineer | 10+ years in production AI systems"
                  value={data.headline}
                  onChange={(e) => updateData({ headline: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell potential clients about your expertise and experience..."
                  value={data.bio}
                  onChange={(e) => updateData({ bio: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate" className="text-slate-300">Hourly Rate (EUR)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="150"
                    value={data.hourlyRate}
                    onChange={(e) => updateData({ hourlyRate: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience" className="text-slate-300">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    placeholder="10"
                    value={data.yearsExperience}
                    onChange={(e) => updateData({ yearsExperience: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Skills & Expertise *</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600 max-h-[200px] overflow-y-auto">
                  {AVAILABLE_SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={data.selectedSkills.includes(skill) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        data.selectedSkills.includes(skill)
                          ? "bg-amber-500 text-slate-900 hover:bg-amber-600"
                          : "border-slate-500 text-slate-300 hover:bg-slate-600"
                      }`}
                      onClick={() => {
                        const skills = data.selectedSkills.includes(skill)
                          ? data.selectedSkills.filter((s) => s !== skill)
                          : [...data.selectedSkills, skill];
                        updateData({ selectedSkills: skills });
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Select all that apply</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <Badge
                      key={lang}
                      variant={data.languages.includes(lang) ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        data.languages.includes(lang)
                          ? "bg-slate-600 text-white"
                          : "border-slate-500 text-slate-300 hover:bg-slate-600"
                      }`}
                      onClick={() => {
                        const langs = data.languages.includes(lang)
                          ? data.languages.filter((l) => l !== lang)
                          : [...data.languages, lang];
                        updateData({ languages: langs });
                      }}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="text-slate-300">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={data.linkedinUrl}
                  onChange={(e) => updateData({ linkedinUrl: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          {/* Step 2: Client Profile (if CLIENT only) */}
          {step === 2 && data.role === "CLIENT" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Your Client Profile</h3>
              <p className="text-sm text-slate-400">This information helps consultants understand your context.</p>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your company or organization"
                  value={data.companyName}
                  onChange={(e) => updateData({ companyName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRole" className="text-slate-300">Your Role</Label>
                <Input
                  id="companyRole"
                  placeholder="e.g., CTO, Product Manager, Founder"
                  value={data.companyRole}
                  onChange={(e) => updateData({ companyRole: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingEmail" className="text-slate-300">Billing Email</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  placeholder="billing@company.com"
                  value={data.billingEmail}
                  onChange={(e) => updateData({ billingEmail: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          {/* Step 3: Client Profile (if BOTH) */}
          {step === 3 && data.role === "BOTH" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Your Client Profile</h3>
              <p className="text-sm text-slate-400">For when you need expert help.</p>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your company or organization"
                  value={data.companyName}
                  onChange={(e) => updateData({ companyName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRole" className="text-slate-300">Your Role</Label>
                <Input
                  id="companyRole"
                  placeholder="e.g., CTO, Product Manager, Founder"
                  value={data.companyRole}
                  onChange={(e) => updateData({ companyRole: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          )}

          {/* Final Step: Consent */}
          {((step === 3 && data.role !== "BOTH") || (step === 4 && data.role === "BOTH")) && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Privacy & Consent</h3>

              {(data.role === "CONSULTANT" || data.role === "BOTH") && (
                <>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentDirectory"
                      checked={data.consentDirectory}
                      onCheckedChange={(checked) => updateData({ consentDirectory: !!checked })}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="consentDirectory" className="text-white cursor-pointer">
                        List me in the consultant directory
                      </Label>
                      <p className="text-sm text-slate-400">
                        Allow clients to find and contact you through the platform.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentHiveMind"
                      checked={data.consentHiveMind}
                      onCheckedChange={(checked) => updateData({ consentHiveMind: !!checked })}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="consentHiveMind" className="text-white cursor-pointer">
                        Contribute to the Hive Mind
                      </Label>
                      <p className="text-sm text-slate-400">
                        Allow anonymized patterns from your engagements to be shared with the community.
                        All content is redacted before sharing.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-300">
                  By completing onboarding, you agree to our Terms of Service and Privacy Policy.
                  You can change these settings at any time from your profile.
                </p>
              </div>
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

            {((step < 3 && data.role !== "BOTH") || (step < 4 && data.role === "BOTH")) ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
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
