import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Search, Star, MapPin, Clock, Building2, Users, Briefcase } from "lucide-react";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string; tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const query = params.q || "";
  const skillFilter = params.skill || "";
  const activeTab = params.tab || (user.role === "CONSULTANT" ? "clients" : "consultants");

  // Everyone can see both directories now
  const isConsultant = user.role === "CONSULTANT" || user.role === "BOTH";

  // Fetch consultants - now available to everyone
  const consultants = await db.consultantProfile.findMany({
    where: {
      isAvailable: true,
      consentDirectory: true,
      userId: { not: user.id }, // Don't show yourself
      AND: [
        query
          ? {
              OR: [
                { headline: { contains: query, mode: "insensitive" } },
                { bio: { contains: query, mode: "insensitive" } },
                { user: { firstName: { contains: query, mode: "insensitive" } } },
                { user: { lastName: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {},
        skillFilter
          ? {
              skills: {
                some: {
                  skillTag: {
                    slug: skillFilter,
                  },
                },
              },
            }
          : {},
      ],
    },
    include: {
      user: {
        include: {
          reviewsReceived: {
            where: { isPublic: true },
            select: { rating: true },
          },
        },
      },
      skills: {
        include: {
          skillTag: true,
        },
        take: 5,
      },
    },
    orderBy: [{ user: { reviewsReceived: { _count: "desc" } } }, { createdAt: "desc" }],
  });

  // Fetch clients (for CONSULTANT or BOTH users)
  const clients = isConsultant
    ? await db.clientProfile.findMany({
        where: {
          userId: { not: user.id }, // Don't show yourself
          AND: [
            query
              ? {
                  OR: [
                    { companyName: { contains: query, mode: "insensitive" } },
                    { user: { firstName: { contains: query, mode: "insensitive" } } },
                    { user: { lastName: { contains: query, mode: "insensitive" } } },
                  ],
                }
              : {},
          ],
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Fetch all skill tags for filtering
  const skillTags = await db.skillTag.findMany({
    orderBy: { name: "asc" },
  });

  // Group skills by category
  const skillsByCategory = skillTags.reduce((acc, skill) => {
    const category = skill.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skillTags>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Directory</h1>
        <p className="text-muted-foreground mt-1">
          Find and connect with experts and clients in the community.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form>
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by name, skill, or expertise..."
              className="pl-10 bg-background border-border"
            />
          </form>
        </div>
      </div>

      {/* Tabs for Consultant/Client selection - Only show tabs for consultants */}
      {isConsultant ? (
        <Tabs defaultValue={activeTab} className="space-y-6">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="consultants" className="data-[state=active]:bg-background">
              <Briefcase className="h-4 w-4 mr-2" />
              Available Consultants ({consultants.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-background">
              <Building2 className="h-4 w-4 mr-2" />
              Clients ({clients.length})
            </TabsTrigger>
          </TabsList>

          {/* Consultant Tab Content */}
          <TabsContent value="consultants" className="space-y-4">
            {/* Skill Tags */}
            <div className="flex flex-wrap gap-2">
              <Link href="/app/directory?tab=consultants">
                <Badge
                  variant={!skillFilter ? "default" : "outline"}
                  className={`cursor-pointer ${
                    !skillFilter
                      ? "bg-amber-500 text-slate-900"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  All
                </Badge>
              </Link>
              {Object.entries(skillsByCategory).map(([category, skills]) => (
                <div key={category} className="flex flex-wrap gap-1">
                  {skills.slice(0, 5).map((skill) => (
                    <Link key={skill.id} href={`/app/directory?tab=consultants&skill=${skill.slug}`}>
                      <Badge
                        variant={skillFilter === skill.slug ? "default" : "outline"}
                        className={`cursor-pointer ${
                          skillFilter === skill.slug
                            ? "bg-amber-500 text-slate-900"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {skill.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {/* Consultant Cards */}
            {consultants.length === 0 ? (
              <Card className="bg-card/50 border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No consultants found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {consultants.map((consultant) => {
                  const avgRating =
                    consultant.user.reviewsReceived.length > 0
                      ? consultant.user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
                        consultant.user.reviewsReceived.length
                      : null;

                  return (
                    <Link key={consultant.id} href={`/app/directory/${consultant.userId}`}>
                      <Card className="bg-card/50 border-border hover:border-amber-500/50 transition-colors h-full">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={consultant.user.imageUrl || undefined} />
                              <AvatarFallback className="bg-muted text-foreground">
                                {consultant.user.firstName?.[0]}
                                {consultant.user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate">
                                {consultant.user.firstName} {consultant.user.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {consultant.headline}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-4 text-sm">
                            {avgRating && (
                              <div className="flex items-center gap-1 text-amber-400">
                                <Star className="h-4 w-4 fill-current" />
                                <span>{avgRating.toFixed(1)}</span>
                              </div>
                            )}
                            {consultant.timezone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{consultant.timezone.split("/")[1]}</span>
                              </div>
                            )}
                            {consultant.hourlyRate && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>€{consultant.hourlyRate / 100}/h</span>
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          <div className="flex flex-wrap gap-1 mt-4">
                            {consultant.skills.map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="outline"
                                className="text-xs border-border"
                              >
                                {skill.skillTag.name}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Client Tab Content */}
          <TabsContent value="clients" className="space-y-4">
            {clients.length === 0 ? (
              <Card className="bg-card/50 border-border">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No clients found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <Card key={client.id} className="bg-card/50 border-border hover:border-amber-500/50 transition-colors h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.user.imageUrl || undefined} />
                          <AvatarFallback className="bg-muted text-foreground">
                            {client.user.firstName?.[0]}
                            {client.user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {client.user.firstName} {client.user.lastName}
                          </h3>
                          {client.companyName && (
                            <p className="text-sm text-muted-foreground truncate">
                              {client.companyName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        {client.companyRole && (
                          <Badge variant="outline" className="border-border">
                            {client.companyRole}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-consultant view - just show consultants */
        <>
          {/* Skill Tags */}
          <div className="flex flex-wrap gap-2">
            <Link href="/app/directory">
              <Badge
                variant={!skillFilter ? "default" : "outline"}
                className={`cursor-pointer ${
                  !skillFilter
                    ? "bg-amber-500 text-slate-900"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                All
              </Badge>
            </Link>
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="flex flex-wrap gap-1">
                {skills.slice(0, 5).map((skill) => (
                  <Link key={skill.id} href={`/app/directory?skill=${skill.slug}`}>
                    <Badge
                      variant={skillFilter === skill.slug ? "default" : "outline"}
                      className={`cursor-pointer ${
                        skillFilter === skill.slug
                          ? "bg-amber-500 text-slate-900"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {skill.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Consultant Cards for non-consultant users */}
          {consultants.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No consultants found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {consultants.map((consultant) => {
                const avgRating =
                  consultant.user.reviewsReceived.length > 0
                    ? consultant.user.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
                      consultant.user.reviewsReceived.length
                    : null;

                return (
                  <Link key={consultant.id} href={`/app/directory/${consultant.userId}`}>
                    <Card className="bg-card/50 border-border hover:border-amber-500/50 transition-colors h-full">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={consultant.user.imageUrl || undefined} />
                            <AvatarFallback className="bg-muted text-foreground">
                              {consultant.user.firstName?.[0]}
                              {consultant.user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">
                              {consultant.user.firstName} {consultant.user.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {consultant.headline}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-4 text-sm">
                          {avgRating && (
                            <div className="flex items-center gap-1 text-amber-400">
                              <Star className="h-4 w-4 fill-current" />
                              <span>{avgRating.toFixed(1)}</span>
                            </div>
                          )}
                          {consultant.timezone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{consultant.timezone.split("/")[1]}</span>
                            </div>
                          )}
                          {consultant.hourlyRate && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>€{consultant.hourlyRate / 100}/h</span>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mt-4">
                          {consultant.skills.map((skill) => (
                            <Badge
                              key={skill.id}
                              variant="outline"
                              className="text-xs border-border"
                            >
                              {skill.skillTag.name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
