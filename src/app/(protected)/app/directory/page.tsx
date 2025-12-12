import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Star, MapPin, Clock } from "lucide-react";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const skillFilter = params.skill || "";

  // Fetch consultants
  const consultants = await db.consultantProfile.findMany({
    where: {
      isAvailable: true,
      consentDirectory: true,
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
        <h1 className="text-2xl font-bold text-white">Consultant Directory</h1>
        <p className="text-slate-400 mt-1">
          Find and connect with experts in AI, engineering, and technology.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <form>
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search by name, skill, or expertise..."
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </form>
        </div>
      </div>

      {/* Skill Tags */}
      <div className="flex flex-wrap gap-2">
        <Link href="/app/directory">
          <Badge
            variant={!skillFilter ? "default" : "outline"}
            className={`cursor-pointer ${
              !skillFilter
                ? "bg-amber-500 text-slate-900"
                : "border-slate-600 text-slate-300 hover:bg-slate-700"
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
                      : "border-slate-600 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {skill.name}
                </Badge>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Results */}
      {consultants.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No consultants found matching your criteria.</p>
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
                <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={consultant.user.imageUrl || undefined} />
                        <AvatarFallback className="bg-slate-700 text-white">
                          {consultant.user.firstName?.[0]}
                          {consultant.user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">
                          {consultant.user.firstName} {consultant.user.lastName}
                        </h3>
                        <p className="text-sm text-slate-400 truncate">
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
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{consultant.timezone.split("/")[1]}</span>
                        </div>
                      )}
                      {consultant.hourlyRate && (
                        <div className="flex items-center gap-1 text-slate-400">
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
                          className="text-xs border-slate-600 text-slate-300"
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
    </div>
  );
}
