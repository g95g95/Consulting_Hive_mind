import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Calendar, Clock, MessageSquare } from "lucide-react";

export default async function EngagementsPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const engagements = await db.engagement.findMany({
    where: {
      booking: {
        OR: [
          { clientId: user.id },
          { consultantId: user.id },
        ],
      },
    },
    include: {
      booking: {
        include: {
          client: true,
          consultant: true,
          request: true,
          payment: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      transferPack: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400";
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400";
      case "TRANSFERRED":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getPaymentStatus = (booking: typeof engagements[0]["booking"]) => {
    if (booking.payment?.status === "SUCCEEDED") return "paid";
    if (booking.payment?.status === "PENDING") return "pending";
    return "unpaid";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Engagements</h1>
        <p className="text-slate-400 mt-1">Your consultation workspaces</p>
      </div>

      {engagements.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No engagements yet</p>
            <p className="text-sm text-slate-500">
              Engagements are created when you book a consultation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {engagements.map((engagement) => {
            const isClient = engagement.booking.clientId === user.id;
            const otherParty = isClient
              ? engagement.booking.consultant
              : engagement.booking.client;
            const paymentStatus = getPaymentStatus(engagement.booking);

            return (
              <Link key={engagement.id} href={`/app/engagements/${engagement.id}`}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParty.imageUrl || undefined} />
                          <AvatarFallback className="bg-slate-700 text-white">
                            {otherParty.firstName?.[0]}
                            {otherParty.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white text-base">
                            {engagement.booking.request?.title || "Direct Consultation"}
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            with {otherParty.firstName} {otherParty.lastName}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusColor(engagement.status)}>
                        {engagement.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {engagement.booking.duration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(engagement.createdAt).toLocaleDateString()}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          paymentStatus === "paid"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : paymentStatus === "pending"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }
                      >
                        {paymentStatus}
                      </Badge>
                    </div>
                    {engagement.messages[0] && (
                      <p className="text-sm text-slate-400 mt-3 truncate">
                        Last message: {engagement.messages[0].content.slice(0, 50)}...
                      </p>
                    )}
                    {engagement.transferPack && (
                      <Badge
                        variant="outline"
                        className="mt-3 bg-purple-500/20 text-purple-400 border-purple-500/30"
                      >
                        Transfer Pack Available
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
