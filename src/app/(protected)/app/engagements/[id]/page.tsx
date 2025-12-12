import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Video, Lock, CreditCard } from "lucide-react";
import Link from "next/link";
import { ChatSection } from "@/components/engagement/chat-section";
import { NotesSection } from "@/components/engagement/notes-section";
import { ChecklistSection } from "@/components/engagement/checklist-section";
import { TransferPackSection } from "@/components/engagement/transfer-pack-section";
import { PaymentBanner } from "@/components/engagement/payment-banner";

export default async function EngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const engagement = await db.engagement.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          client: true,
          consultant: true,
          request: {
            include: {
              skills: { include: { skillTag: true } },
            },
          },
          payment: true,
        },
      },
      messages: {
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
      notes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      artifacts: {
        orderBy: { createdAt: "desc" },
      },
      checklistItems: {
        orderBy: { order: "asc" },
      },
      transferPack: true,
      reviews: {
        include: { author: true },
      },
    },
  });

  if (!engagement) {
    notFound();
  }

  // Check if user is a participant
  const isClient = engagement.booking.clientId === user.id;
  const isConsultant = engagement.booking.consultantId === user.id;

  if (!isClient && !isConsultant) {
    notFound();
  }

  const otherParty = isClient
    ? engagement.booking.consultant
    : engagement.booking.client;

  const isPaid = engagement.booking.payment?.status === "SUCCEEDED";
  const isLocked = !isPaid;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/app/engagements"
        className="inline-flex items-center text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Engagements
      </Link>

      {/* Payment Banner */}
      {isLocked && isClient && (
        <PaymentBanner bookingId={engagement.booking.id} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherParty.imageUrl || undefined} />
            <AvatarFallback className="bg-slate-700 text-white">
              {otherParty.firstName?.[0]}
              {otherParty.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {engagement.booking.request?.title || "Consultation"}
            </h1>
            <p className="text-slate-400">
              with {otherParty.firstName} {otherParty.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              engagement.status === "ACTIVE"
                ? "bg-green-500/20 text-green-400"
                : engagement.status === "COMPLETED"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-slate-500/20 text-slate-400"
            }
          >
            {engagement.status}
          </Badge>
          {isPaid ? (
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              Paid
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
              Unpaid
            </Badge>
          )}
        </div>
      </div>

      {/* Locked Overlay */}
      {isLocked && !isClient && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-400" />
            <p className="text-amber-400">
              Waiting for client to complete payment before workspace is fully active.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="chat" className="space-y-4">
            <TabsList className="bg-slate-800 border border-slate-700">
              <TabsTrigger value="chat" className="data-[state=active]:bg-slate-700">
                Chat
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-slate-700">
                Notes
              </TabsTrigger>
              <TabsTrigger value="checklist" className="data-[state=active]:bg-slate-700">
                Checklist
              </TabsTrigger>
              <TabsTrigger value="transfer" className="data-[state=active]:bg-slate-700">
                Transfer Pack
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <ChatSection
                engagementId={engagement.id}
                messages={engagement.messages}
                currentUserId={user.id}
                isLocked={isLocked}
              />
            </TabsContent>

            <TabsContent value="notes">
              <NotesSection
                engagementId={engagement.id}
                notes={engagement.notes}
                currentUserId={user.id}
                isLocked={isLocked}
              />
            </TabsContent>

            <TabsContent value="checklist">
              <ChecklistSection
                engagementId={engagement.id}
                items={engagement.checklistItems}
                isLocked={isLocked}
              />
            </TabsContent>

            <TabsContent value="transfer">
              <TransferPackSection
                engagementId={engagement.id}
                engagement={engagement}
                transferPack={engagement.transferPack}
                isClient={isClient}
                isLocked={isLocked}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Video Link */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video Call
              </CardTitle>
            </CardHeader>
            <CardContent>
              {engagement.videoLink ? (
                <a
                  href={engagement.videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 text-sm break-all"
                >
                  {engagement.videoLink}
                </a>
              ) : (
                <p className="text-sm text-slate-500">No video link set</p>
              )}
            </CardContent>
          </Card>

          {/* Request Details */}
          {engagement.booking.request && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {engagement.booking.request.refinedSummary && (
                  <p className="text-sm text-slate-400">
                    {engagement.booking.request.refinedSummary}
                  </p>
                )}
                {engagement.booking.request.desiredOutcome && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Desired Outcome</p>
                    <p className="text-sm text-slate-300">
                      {engagement.booking.request.desiredOutcome}
                    </p>
                  </div>
                )}
                {engagement.booking.request.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {engagement.booking.request.skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="outline"
                        className="text-xs border-slate-600 text-slate-300"
                      >
                        {skill.skillTag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Artifacts */}
          {engagement.artifacts.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Links & Artifacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {engagement.artifacts.map((artifact) => (
                  <a
                    key={artifact.id}
                    href={artifact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <p className="text-sm text-white truncate">{artifact.title}</p>
                    <p className="text-xs text-slate-500 truncate">{artifact.url}</p>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
