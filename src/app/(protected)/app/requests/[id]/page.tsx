import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, AlertTriangle, Star } from "lucide-react";
import { OfferActions } from "@/components/offer-actions";
import { AcceptOfferButton } from "@/components/accept-offer-button";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const request = await db.request.findUnique({
    where: { id },
    include: {
      creator: true,
      skills: { include: { skillTag: true } },
      offers: {
        include: {
          consultant: {
            include: {
              user: {
                include: {
                  reviewsReceived: {
                    where: { isPublic: true },
                    select: { rating: true },
                  },
                },
              },
              skills: { include: { skillTag: true } },
            },
          },
        },
      },
      bookings: {
        include: {
          engagement: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const isOwner = request.creatorId === user.id;
  const isConsultant = user.role === "CONSULTANT" || user.role === "BOTH";
  const hasOffered = request.offers.some(
    (o) => o.consultant.userId === user.id
  );
  const myOffer = request.offers.find((o) => o.consultant.userId === user.id);
  const acceptedOffer = request.offers.find((o) => o.status === "ACCEPTED");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/20 text-amber-400";
      case "ACCEPTED":
        return "bg-green-500/20 text-green-400";
      case "DECLINED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/app/requests"
        className="inline-flex items-center text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Requests
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">{request.title}</CardTitle>
                  <CardDescription className="text-slate-400 mt-2">
                    Created by {request.creator.firstName} {request.creator.lastName} on{" "}
                    {new Date(request.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    request.status === "PUBLISHED"
                      ? "bg-amber-500/20 text-amber-400"
                      : request.status === "BOOKED"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-slate-500/20 text-slate-400"
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.sensitiveData && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-amber-400">
                    This request may involve sensitive data
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {request.suggestedDuration} min session
                </div>
                <Badge
                  variant="outline"
                  className={
                    request.urgency === "URGENT"
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : request.urgency === "HIGH"
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "border-slate-600 text-slate-400"
                  }
                >
                  {request.urgency} Priority
                </Badge>
                {request.budget && (
                  <span className="text-slate-400">
                    Budget: €{request.budget / 100}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {request.refinedSummary && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">{request.refinedSummary}</p>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-4">
            {request.constraints && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{request.constraints}</p>
                </CardContent>
              </Card>
            )}

            {request.desiredOutcome && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Desired Outcome</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{request.desiredOutcome}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Original Description */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Original Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 whitespace-pre-wrap">{request.rawDescription}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          {request.skills.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {request.skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {skill.skillTag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions for Consultants */}
          {isConsultant && !isOwner && !hasOffered && request.status === "PUBLISHED" && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Interested?</CardTitle>
                <CardDescription className="text-slate-400">
                  Make an offer on this request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OfferActions requestId={request.id} userId={user.id} />
              </CardContent>
            </Card>
          )}

          {/* My Offer Status */}
          {myOffer && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Your Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className={getStatusColor(myOffer.status)}>
                  {myOffer.status}
                </Badge>
                {myOffer.message && (
                  <p className="text-sm text-slate-400 mt-2">{myOffer.message}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Offers (for owner) */}
          {isOwner && request.offers.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Offers ({request.offers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.offers.map((offer) => {
                  const avgRating =
                    offer.consultant.user.reviewsReceived.length > 0
                      ? offer.consultant.user.reviewsReceived.reduce(
                          (sum, r) => sum + r.rating,
                          0
                        ) / offer.consultant.user.reviewsReceived.length
                      : null;

                  return (
                    <div
                      key={offer.id}
                      className="p-3 rounded-lg bg-slate-700/30 border border-slate-600"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={offer.consultant.user.imageUrl || undefined} />
                          <AvatarFallback className="bg-slate-600 text-white text-sm">
                            {offer.consultant.user.firstName?.[0]}
                            {offer.consultant.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/app/directory/${offer.consultant.userId}`}
                              className="font-medium text-white hover:text-amber-400"
                            >
                              {offer.consultant.user.firstName}{" "}
                              {offer.consultant.user.lastName}
                            </Link>
                            <Badge variant="outline" className={getStatusColor(offer.status)}>
                              {offer.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {offer.consultant.headline}
                          </p>
                          {avgRating && (
                            <div className="flex items-center gap-1 text-sm text-amber-400 mt-1">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{avgRating.toFixed(1)}</span>
                            </div>
                          )}
                          {offer.message && (
                            <p className="text-sm text-slate-300 mt-2">{offer.message}</p>
                          )}
                          {offer.status === "PENDING" && (
                            <div className="mt-3">
                              <AcceptOfferButton
                                offerId={offer.id}
                                requestId={request.id}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Booking Info */}
          {request.bookings.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Booking</CardTitle>
              </CardHeader>
              <CardContent>
                {request.bookings.map((booking) => (
                  <div key={booking.id} className="space-y-2">
                    <Badge
                      variant="outline"
                      className={
                        booking.status === "CONFIRMED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-slate-500/20 text-slate-400"
                      }
                    >
                      {booking.status}
                    </Badge>
                    {booking.scheduledStart && (
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.scheduledStart).toLocaleString()}
                      </p>
                    )}
                    {booking.engagement && (
                      <Link href={`/app/engagements/${booking.engagement.id}`}>
                        <Button className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-900">
                          Go to Workspace
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
