"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Briefcase, Building2, Camera, Plus, Globe, Languages, Clock } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  role: string;
  consultantProfile?: {
    id: string;
    bio: string;
    headline: string;
    hourlyRate: number;
    languages: string[];
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    timezone: string | null;
    yearsExperience: number | null;
    isAvailable: boolean;
    consentDirectory: boolean;
    consentHiveMind: boolean;
    skills: Array<{ skillTag: { name: string } }>;
  } | null;
  clientProfile?: {
    id: string;
    companyName: string | null;
    companyRole: string | null;
    preferredLanguage: string | null;
    billingEmail: string | null;
  } | null;
}

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [creatingClientProfile, setCreatingClientProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consultant form state
  const [bio, setBio] = useState("");
  const [headline, setHeadline] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [timezone, setTimezone] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [consentDirectory, setConsentDirectory] = useState(true);
  const [consentHiveMind, setConsentHiveMind] = useState(false);

  // Client form state
  const [companyName, setCompanyName] = useState("");
  const [companyRole, setCompanyRole] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/profile-photo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setProfile((prev) => prev ? { ...prev, imageUrl: url } : null);
        toast.success("Profile photo updated!");
      } else {
        const error = await response.json();
        console.error("Photo upload error:", error);
        toast.error(error.error || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);

        // Populate consultant form fields
        if (data.consultantProfile) {
          setBio(data.consultantProfile.bio || "");
          setHeadline(data.consultantProfile.headline || "");
          setHourlyRate(data.consultantProfile.hourlyRate ? (data.consultantProfile.hourlyRate / 100).toString() : "");
          setLinkedinUrl(data.consultantProfile.linkedinUrl || "");
          setPortfolioUrl(data.consultantProfile.portfolioUrl || "");
          setTimezone(data.consultantProfile.timezone || "");
          setYearsExperience(data.consultantProfile.yearsExperience?.toString() || "");
          setIsAvailable(data.consultantProfile.isAvailable ?? true);
          setConsentDirectory(data.consultantProfile.consentDirectory ?? true);
          setConsentHiveMind(data.consultantProfile.consentHiveMind ?? false);
        }
        // Populate client form fields
        if (data.clientProfile) {
          setCompanyName(data.clientProfile.companyName || "");
          setCompanyRole(data.clientProfile.companyRole || "");
          setPreferredLanguage(data.clientProfile.preferredLanguage || "");
          setBillingEmail(data.clientProfile.billingEmail || "");
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
          hourlyRate: Math.round(parseFloat(hourlyRate) * 100) || 0, // Convert to cents
          linkedinUrl: linkedinUrl || null,
          portfolioUrl: portfolioUrl || null,
          timezone: timezone || null,
          yearsExperience: parseInt(yearsExperience) || null,
          isAvailable,
          consentDirectory,
          consentHiveMind,
        }),
      });

      if (response.ok) {
        await fetchProfile();
        toast.success("Consultant profile saved!");
      } else {
        toast.error("Failed to save consultant profile");
      }
    } catch (error) {
      console.error("Error saving consultant profile:", error);
      toast.error("Failed to save consultant profile");
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
          companyRole: companyRole || null,
          preferredLanguage: preferredLanguage || null,
          billingEmail: billingEmail || null,
        }),
      });

      if (response.ok) {
        await fetchProfile();
        toast.success("Client profile saved!");
      } else {
        toast.error("Failed to save client profile");
      }
    } catch (error) {
      console.error("Error saving client profile:", error);
      toast.error("Failed to save client profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClientProfile = async () => {
    setCreatingClientProfile(true);
    try {
      const response = await fetch("/api/profile/client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        await fetchProfile();
        toast.success("Client profile created! You can now use the platform as a client.");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create client profile");
      }
    } catch (error) {
      console.error("Error creating client profile:", error);
      toast.error("Failed to create client profile");
    } finally {
      setCreatingClientProfile(false);
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
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="h-6 w-6 text-amber-500" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile information and settings
        </p>
      </div>

      {/* Basic Info Card */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Basic Information</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your profile photo and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            {/* Profile Photo with Upload */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {profile?.imageUrl || clerkUser?.imageUrl ? (
                  <img
                    src={profile?.imageUrl || clerkUser?.imageUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>

              {/* Upload overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1">
              <p className="text-lg font-medium text-foreground">
                {profile?.firstName} {profile?.lastName}
              </p>
              <p className="text-muted-foreground">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
              <Badge variant="outline" className="mt-1 border-amber-500 text-amber-400">
                {profile?.role}
              </Badge>

              <p className="text-xs text-muted-foreground mt-2">
                Click on your photo to upload a new one (max 5MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific profiles */}
      <Tabs defaultValue={profile?.consultantProfile ? "consultant" : "client"} className="space-y-4">
        <TabsList className="bg-muted border border-border">
          {profile?.consultantProfile && (
            <TabsTrigger value="consultant" className="data-[state=active]:bg-background">
              <Briefcase className="h-4 w-4 mr-2" />
              Consultant Profile
            </TabsTrigger>
          )}
          {profile?.clientProfile && (
            <TabsTrigger value="client" className="data-[state=active]:bg-background">
              <Building2 className="h-4 w-4 mr-2" />
              Client Profile
            </TabsTrigger>
          )}
        </TabsList>

        {/* Consultant Profile Tab */}
        {profile?.consultantProfile && (
          <TabsContent value="consultant">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Consultant Profile</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Information visible to clients looking for consultants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Headline & Bio */}
                <div className="space-y-2">
                  <Label htmlFor="headline" className="text-foreground">Headline</Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Senior Cloud Architect | AWS Expert"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-foreground">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your expertise and experience..."
                    className="bg-background border-border min-h-[120px]"
                  />
                </div>

                {/* Rate & Experience */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Hourly Rate (EUR)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="150"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience" className="text-foreground">Years of Experience</Label>
                    <Input
                      id="yearsExperience"
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      placeholder="10"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-foreground flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      LinkedIn URL
                    </Label>
                    <Input
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolioUrl" className="text-foreground">Portfolio URL</Label>
                    <Input
                      id="portfolioUrl"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Europe/Rome"
                    className="bg-background border-border"
                  />
                </div>

                {/* Skills */}
                {profile?.consultantProfile?.skills && profile.consultantProfile.skills.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {profile.consultantProfile.skills.map((s, i) => (
                        <Badge key={i} variant="outline" className="border-border">
                          {s.skillTag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability & Consent toggles */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Available for work</Label>
                      <p className="text-xs text-muted-foreground">Show as available in directory</p>
                    </div>
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={setIsAvailable}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Directory listing</Label>
                      <p className="text-xs text-muted-foreground">Allow profile to appear in consultant directory</p>
                    </div>
                    <Switch
                      checked={consentDirectory}
                      onCheckedChange={setConsentDirectory}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Hive Mind contributions</Label>
                      <p className="text-xs text-muted-foreground">Allow anonymized patterns from your engagements</p>
                    </div>
                    <Switch
                      checked={consentHiveMind}
                      onCheckedChange={setConsentHiveMind}
                    />
                  </div>
                </div>

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
        {profile?.clientProfile && (
          <TabsContent value="client">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Client Profile</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your organization details for booking consultants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-foreground">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company name"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyRole" className="text-foreground">Your Role</Label>
                    <Input
                      id="companyRole"
                      value={companyRole}
                      onChange={(e) => setCompanyRole(e.target.value)}
                      placeholder="e.g., CTO, Product Manager"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredLanguage" className="text-foreground">Preferred Language</Label>
                    <Input
                      id="preferredLanguage"
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      placeholder="e.g., English, Italian"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingEmail" className="text-foreground">Billing Email</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="billing@company.com"
                      className="bg-background border-border"
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

      {/* Add Client Profile Card - Only for CONSULTANT role without client profile */}
      {profile?.role === "CONSULTANT" && !profile?.clientProfile && (
        <Card className="bg-card/50 border-border border-dashed">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              Also need consulting services?
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Consultants can also be clients. Create a client profile to book other consultants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateClientProfile}
              disabled={creatingClientProfile}
              variant="outline"
              className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
            >
              {creatingClientProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Client Profile
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
