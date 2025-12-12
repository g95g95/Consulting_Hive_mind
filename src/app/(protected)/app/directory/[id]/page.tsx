import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateClientProfileButton } from "@/components/create-client-profile-button";
import Link from "next/link";
import {
  Star,
  MapPin,
  Clock,
  Globe,
  Linkedin,
  ExternalLink,
  Calendar,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export default async function ConsultantProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const consultant = await db.consultantProfile.findUnique({
    where: {
      userId: id,
      isAvailable: true,
      consentDirectory: true,
    },
    include: {
      user: {
        include: {
          reviewsReceived: {
            where: { isPublic: true },
            include: {
              author: true,
              engagement: {
                include: {
                  booking: {
                    include: { request: true },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
      skills: {
        include: {
          skillTag: true,
        },
      },
      references: {
        where: { isPublic: true },
      },
      availability: true,
    },
  });

  if (!consultant) {
    notFound();
  }

  const avgRating =
    consultant.user.reviewsReceived.length > 0
      ? consultant.user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
        consultant.user.reviewsReceived.length
      : null;

  const isOwnProfile = currentUser?.id === consultant.userId;

  // Check if current user can book (has client profile or is CLIENT/BOTH)
  const canBook = currentUser?.role === "CLIENT" || currentUser?.role === "BOTH";
  const isConsultantOnly = currentUser?.role === "CONSULTANT";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/app/directory"
        className="inline-flex items-center text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Directory
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={consultant.user.imageUrl || undefined} />
                  <AvatarFallback className="bg-slate-700 text-white text-2xl">
                    {consultant.user.firstName?.[0]}
                    {consultant.user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white">
                    {consultant.user.firstName} {consultant.user.lastName}
                  </h1>
                  <p className="text-slate-400 mt-1">{consultant.headline}</p>

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                    {avgRating && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span>{avgRating.toFixed(1)}</span>
                        <span className="text-slate-500">
                          ({consultant.user.reviewsReceived.length} reviews)
                        </span>
                      </div>
                    )}
                    {consultant.yearsExperience && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{consultant.yearsExperience} years exp.</span>
                      </div>
                    )}
                    {consultant.timezone && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span>{consultant.timezone}</span>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {consultant.linkedinUrl && (
                      <a
                        href={consultant.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300"
                      >
                        <Linkedin className="h-4 w-4 mr-1" />
                        LinkedIn
                      </a>
                    )}
                    {consultant.portfolioUrl && (
                      <a
                        href={consultant.portfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-slate-400 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {consultant.bio && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 whitespace-pre-wrap">{consultant.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              {consultant.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {consultant.skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {skill.skillTag.name}
                      {skill.level !== "INTERMEDIATE" && (
                        <span className="ml-1 text-amber-400">
                          ({skill.level.toLowerCase()})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No skills listed yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          {consultant.user.reviewsReceived.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {consultant.user.reviewsReceived.map((review) => (
                  <div key={review.id} className="border-b border-slate-700 pb-4 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-slate-700 text-white text-xs">
                            {review.author.firstName?.[0]}
                            {review.author.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-white">
                          {review.author.firstName} {review.author.lastName?.[0]}.
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-current" : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-slate-400 text-sm mt-2">{review.comment}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Book a Consultation</CardTitle>
              <CardDescription className="text-slate-400">
                Choose a session length
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultant.hourlyRate && (
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-3xl font-bold text-white">
                    €{consultant.hourlyRate / 100}
                  </p>
                  <p className="text-sm text-slate-400">per hour</p>
                </div>
              )}

              {!isOwnProfile && canBook && (
                <>
                  <Link href={`/app/requests/new?consultant=${consultant.userId}`}>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Session
                    </Button>
                  </Link>
                  <p className="text-xs text-slate-500 text-center">
                    You can also create a general request and let consultants come to you.
                  </p>
                </>
              )}

              {!isOwnProfile && isConsultantOnly && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-400 font-medium">
                          Create a client profile to book
                        </p>
                        <p className="text-xs text-amber-300/80 mt-1">
                          As a consultant, you need to create a client profile first to book other consultants.
                        </p>
                      </div>
                    </div>
                  </div>
                  <CreateClientProfileButton consultantId={consultant.userId} />
                </div>
              )}

              {isOwnProfile && (
                <Link href="/app/profile">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Languages */}
          {consultant.languages.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {consultant.languages.map((lang) => (
                    <Badge key={lang} variant="outline" className="border-slate-600 text-slate-300">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* References */}
          {consultant.references.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">References</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultant.references.map((ref) => (
                  <div key={ref.id} className="text-sm">
                    <p className="text-white font-medium">{ref.name}</p>
                    {ref.role && ref.company && (
                      <p className="text-slate-400">
                        {ref.role} at {ref.company}
                      </p>
                    )}
                    {ref.testimonial && (
                      <p className="text-slate-400 italic mt-1">&ldquo;{ref.testimonial}&rdquo;</p>
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
