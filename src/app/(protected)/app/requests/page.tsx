import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { PlusCircle, Clock, Calendar } from "lucide-react";

export default async function RequestsPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  const isConsultant = user.role === "CONSULTANT" || user.role === "BOTH";
  const canCreateRequests = user.role === "CLIENT" || user.role === "BOTH";

  // Fetch my requests
  const myRequests = await db.request.findMany({
    where: { creatorId: user.id },
    include: {
      skills: { include: { skillTag: true } },
      offers: { include: { consultant: { include: { user: true } } } },
      bookings: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch open requests (for consultants)
  const openRequests = isConsultant
    ? await db.request.findMany({
        where: {
          isPublic: true,
          status: { in: ["PUBLISHED", "MATCHING"] },
          creatorId: { not: user.id },
        },
        include: {
          creator: true,
          skills: { include: { skillTag: true } },
          offers: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Fetch requests I've offered on
  const myOffers = isConsultant
    ? await db.offer.findMany({
        where: {
          consultant: { userId: user.id },
        },
        include: {
          request: {
            include: {
              creator: true,
              skills: { include: { skillTag: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-slate-500/20 text-slate-400";
      case "PUBLISHED":
        return "bg-amber-500/20 text-amber-400";
      case "MATCHING":
        return "bg-blue-500/20 text-blue-400";
      case "BOOKED":
        return "bg-green-500/20 text-green-400";
      case "IN_PROGRESS":
        return "bg-purple-500/20 text-purple-400";
      case "COMPLETED":
        return "bg-slate-500/20 text-slate-400";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Requests</h1>
          <p className="text-slate-400 mt-1">
            {canCreateRequests ? "Manage your consultation requests" : "Browse and respond to consultation requests"}
          </p>
        </div>
        {canCreateRequests && (
          <Link href="/app/requests/new">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        )}
      </div>

      <Tabs defaultValue="my-requests" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="my-requests" className="data-[state=active]:bg-slate-700">
            My Requests ({myRequests.length})
          </TabsTrigger>
          {isConsultant && (
            <>
              <TabsTrigger value="open" className="data-[state=active]:bg-slate-700">
                Open Requests ({openRequests.length})
              </TabsTrigger>
              <TabsTrigger value="my-offers" className="data-[state=active]:bg-slate-700">
                My Offers ({myOffers.length})
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          {myRequests.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400 mb-4">
                  {canCreateRequests
                    ? "You haven't created any requests yet."
                    : "You don't have any requests associated with your account."}
                </p>
                {canCreateRequests && (
                  <Link href="/app/requests/new">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      Create Your First Request
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            myRequests.map((request) => (
              <Link key={request.id} href={`/app/requests/${request.id}`}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white">{request.title}</CardTitle>
                        <CardDescription className="text-slate-400 mt-1">
                          {request.refinedSummary?.slice(0, 150)}
                          {(request.refinedSummary?.length || 0) > 150 && "..."}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {request.suggestedDuration} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      {request.offers.length > 0 && (
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {request.offers.length} offer(s)
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {request.skills.slice(0, 4).map((skill) => (
                        <Badge
                          key={skill.id}
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-300"
                        >
                          {skill.skillTag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        {isConsultant && (
          <TabsContent value="open" className="space-y-4">
            {openRequests.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">No open requests at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              openRequests.map((request) => (
                <Link key={request.id} href={`/app/requests/${request.id}`}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white">{request.title}</CardTitle>
                          <CardDescription className="text-slate-400 mt-1">
                            by {request.creator.firstName} {request.creator.lastName?.[0]}.
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            request.urgency === "URGENT"
                              ? "bg-red-500/20 text-red-400"
                              : request.urgency === "HIGH"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-slate-500/20 text-slate-400"
                          }
                        >
                          {request.urgency}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-300 mb-3">
                        {request.refinedSummary?.slice(0, 200)}
                        {(request.refinedSummary?.length || 0) > 200 && "..."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {request.skills.slice(0, 4).map((skill) => (
                          <Badge
                            key={skill.id}
                            variant="outline"
                            className="text-xs border-slate-600 text-slate-300"
                          >
                            {skill.skillTag.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>
        )}

        {isConsultant && (
          <TabsContent value="my-offers" className="space-y-4">
            {myOffers.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <p className="text-slate-400">You haven&apos;t made any offers yet.</p>
                </CardContent>
              </Card>
            ) : (
              myOffers.map((offer) => (
                <Link key={offer.id} href={`/app/requests/${offer.request.id}`}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white">{offer.request.title}</CardTitle>
                          <CardDescription className="text-slate-400 mt-1">
                            by {offer.request.creator.firstName}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            offer.status === "ACCEPTED"
                              ? "bg-green-500/20 text-green-400"
                              : offer.status === "DECLINED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }
                        >
                          {offer.status}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
