import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Lock } from "lucide-react";
import { HiveDataTable } from "@/components/hive-data-table";

export default async function HiveMindPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  // Fetch engagements that have at least one approved contribution (or user's own)
  // OR engagements where user is participant
  const engagements = await db.engagement.findMany({
    where: {
      OR: [
        // Engagements with approved patterns
        { patterns: { some: { status: "APPROVED" } } },
        // Engagements with approved prompts
        { prompts: { some: { status: "APPROVED" } } },
        // Engagements with approved stacks
        { stacks: { some: { status: "APPROVED" } } },
        // User's own contributions (pending or approved)
        { patterns: { some: { creatorId: user.id } } },
        { prompts: { some: { creatorId: user.id } } },
        { stacks: { some: { creatorId: user.id } } },
      ],
    },
    include: {
      booking: {
        include: {
          request: true,
          client: true,
          consultant: true,
        },
      },
      patterns: {
        where: {
          OR: [
            { status: "APPROVED" },
            { creatorId: user.id },
          ],
        },
        include: { creator: true },
        orderBy: { createdAt: "desc" },
      },
      prompts: {
        where: {
          OR: [
            { status: "APPROVED" },
            { creatorId: user.id },
          ],
        },
        include: { creator: true },
        orderBy: { createdAt: "desc" },
      },
      stacks: {
        where: {
          OR: [
            { status: "APPROVED" },
            { creatorId: user.id },
          ],
        },
        include: { creator: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also fetch standalone contributions (not linked to engagements)
  const [standalonePatterns, standalonePrompts, standaloneStacks] = await Promise.all([
    db.pattern.findMany({
      where: {
        engagementId: null,
        OR: [
          { status: "APPROVED" },
          { creatorId: user.id },
        ],
      },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
    }),
    db.prompt.findMany({
      where: {
        engagementId: null,
        OR: [
          { status: "APPROVED" },
          { creatorId: user.id },
        ],
      },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
    }),
    db.stackTemplate.findMany({
      where: {
        engagementId: null,
        OR: [
          { status: "APPROVED" },
          { creatorId: user.id },
        ],
      },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Transform engagements for the data table
  const engagementItems = engagements.map((e) => ({
    id: e.id,
    type: "engagement" as const,
    title: e.booking.request?.title || "Direct Consultation",
    description: e.booking.request?.refinedSummary || e.booking.request?.rawDescription || "No description",
    clientName: `${e.booking.client.firstName || ""} ${e.booking.client.lastName || ""}`.trim() || "Anonymous",
    consultantName: `${e.booking.consultant.firstName || ""} ${e.booking.consultant.lastName || ""}`.trim() || "Anonymous",
    clientId: e.booking.clientId,
    consultantId: e.booking.consultantId,
    createdAt: e.createdAt,
    patterns: e.patterns.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      content: p.content,
      category: p.category,
      tags: p.tags,
      status: p.status,
      creator: p.creator,
      creatorId: p.creatorId,
    })),
    prompts: e.prompts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      content: p.content,
      useCase: p.useCase,
      tags: p.tags,
      status: p.status,
      creator: p.creator,
      creatorId: p.creatorId,
    })),
    stacks: e.stacks.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      content: s.content,
      category: s.category,
      tags: s.tags,
      uiTech: s.uiTech,
      backendTech: s.backendTech,
      databaseTech: s.databaseTech,
      releaseTech: s.releaseTech,
      status: s.status,
      creator: s.creator,
      creatorId: s.creatorId,
    })),
  }));

  // Add standalone items as a special "General Library" row if any exist
  const hasStandalone = standalonePatterns.length > 0 || standalonePrompts.length > 0 || standaloneStacks.length > 0;

  const standaloneItem = hasStandalone ? {
    id: "standalone",
    type: "standalone" as const,
    title: "General Library",
    description: "Contributions not linked to specific engagements",
    clientName: "-",
    consultantName: "-",
    clientId: null,
    consultantId: null,
    createdAt: new Date(),
    patterns: standalonePatterns.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      content: p.content,
      category: p.category,
      tags: p.tags,
      status: p.status,
      creator: p.creator,
      creatorId: p.creatorId,
    })),
    prompts: standalonePrompts.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      content: p.content,
      useCase: p.useCase,
      tags: p.tags,
      status: p.status,
      creator: p.creator,
      creatorId: p.creatorId,
    })),
    stacks: standaloneStacks.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      content: s.content,
      category: s.category,
      tags: s.tags,
      uiTech: s.uiTech,
      backendTech: s.backendTech,
      databaseTech: s.databaseTech,
      releaseTech: s.releaseTech,
      status: s.status,
      creator: s.creator,
      creatorId: s.creatorId,
    })),
  } : null;

  const allItems = standaloneItem ? [standaloneItem, ...engagementItems] : engagementItems;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hive Mind</h1>
          <p className="text-muted-foreground mt-1">
            Shared cognitive residue from the community &mdash; patterns, prompts, and stacks.
          </p>
        </div>
        <Link href="/app/hive/contribute">
          <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
            <Plus className="mr-2 h-4 w-4" />
            Contribute
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">Members Only</p>
              <p className="text-sm text-amber-300/80">
                All content is anonymized and sanitized before being shared.
                Raw engagement content is never visible to the community.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <HiveDataTable items={allItems} currentUserId={user.id} />
    </div>
  );
}
