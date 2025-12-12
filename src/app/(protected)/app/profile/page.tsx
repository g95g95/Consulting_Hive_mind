"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, User, Briefcase, Building2 } from "lucide-react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  consultantProfile?: {
    id: string;
    bio: string;
    headline: string;
    hourlyRate: number;
    languages: string[];
    linkedinUrl: string | null;
    skills: Array<{ skill: { name: string } }>;
  } | null;
  clientProfile?: {
    id: string;
    companyName: string | null;
    industry: string | null;
    companySize: string | null;
  } | null;
}

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Consultant form state
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Client form state
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);

        // Populate form fields
        if (data.consultantProfile) {
          setBio(data.consultantProfile.bio || "");
          setHeadline(data.consultantProfile.headline || "");
          setHourlyRate(data.consultantProfile.hourlyRate?.toString() || "");
          setLinkedinUrl(data.consultantProfile.linkedinUrl || "");
        }
        if (data.clientProfile) {
          setCompanyName(data.clientProfile.companyName || "");
          setIndustry(data.clientProfile.industry || "");
          setCompanySize(data.clientProfile.companySize || "");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConsultant = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile/consultant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          headline,
          hourlyRate: parseFloat(hourlyRate) || 0,
          linkedinUrl: linkedinUrl || null,
        }),
      });

      if (response.ok) {
        await fetchProfile();
      }
    } catch (error) {
      console.error("Error saving consultant profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClient = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile/client", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName || null,
          industry: industry || null,
          companySize: companySize || null,
        }),
      });

      if (response.ok) {
        await fetchProfile();
      }
    } catch (error) {
      console.error("Error saving client profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="h-6 w-6 text-amber-500" />
          My Profile
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your profile information and settings
        </p>
      </div>

      {/* Basic Info Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Basic Information</CardTitle>
          <CardDescription className="text-slate-400">
            Your account details from Clerk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {clerkUser?.imageUrl && (
              <img
                src={clerkUser.imageUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-medium text-white">
                {profile?.firstName} {profile?.lastName}
              </p>
              <p className="text-slate-400">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
              <Badge variant="outline" className="mt-1 border-amber-500 text-amber-400">
                {profile?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific profiles */}
      <Tabs defaultValue={profile?.consultantProfile ? "consultant" : "client"} className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          {(profile?.role === "CONSULTANT" || profile?.role === "BOTH") && (
            <TabsTrigger value="consultant" className="data-[state=active]:bg-slate-700">
              <Briefcase className="h-4 w-4 mr-2" />
              Consultant Profile
            </TabsTrigger>
          )}
          {(profile?.role === "CLIENT" || profile?.role === "BOTH") && (
            <TabsTrigger value="client" className="data-[state=active]:bg-slate-700">
              <Building2 className="h-4 w-4 mr-2" />
              Client Profile
            </TabsTrigger>
          )}
        </TabsList>

        {/* Consultant Profile Tab */}
        {(profile?.role === "CONSULTANT" || profile?.role === "BOTH") && (
          <TabsContent value="consultant">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Consultant Profile</CardTitle>
                <CardDescription className="text-slate-400">
                  Information visible to clients looking for consultants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headline" className="text-slate-300">Headline</Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Senior Cloud Architect | AWS Expert"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your expertise and experience..."
                    className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-slate-300">Hourly Rate (EUR)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="150"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-slate-300">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {profile?.consultantProfile?.skills && profile.consultantProfile.skills.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.consultantProfile.skills.map((s, i) => (
                        <Badge key={i} variant="outline" className="border-slate-600 text-slate-300">
                          {s.skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSaveConsultant}
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Consultant Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Client Profile Tab */}
        {(profile?.role === "CLIENT" || profile?.role === "BOTH") && (
          <TabsContent value="client">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Client Profile</CardTitle>
                <CardDescription className="text-slate-400">
                  Your organization details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your company name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-slate-300">Industry</Label>
                    <Input
                      id="industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., Fintech, Healthcare"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companySize" className="text-slate-300">Company Size</Label>
                    <Input
                      id="companySize"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      placeholder="e.g., 10-50, 100-500"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveClient}
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Client Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
