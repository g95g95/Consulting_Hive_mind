"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Construction } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-amber-500" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Construction className="h-5 w-5 text-amber-500" />
            Section Under Construction
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We&apos;re working on bringing you more settings options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section is currently being developed. Soon you&apos;ll be able to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Manage notification preferences</li>
            <li>Configure privacy settings</li>
            <li>Set up two-factor authentication</li>
            <li>Manage connected accounts</li>
            <li>Export your data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
