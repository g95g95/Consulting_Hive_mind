import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  // Determine if user is consultant only (to show clients) or client/both (to show consultants)
  const showClientsInDirectory = user.role === "CONSULTANT";

  // Fetch dashboard stats
  const [requestCount, engagementCount, directoryCount] = await Promise.all([
    db.request.count({
      where: { creatorId: user.id },
    }),
    db.engagement.count({
      where: {
        booking: {
          OR: [
            { clientId: user.id },
            { consultantId: user.id },
          ],
        },
      },
    }),
    // Count consultants or clients based on user role
    showClientsInDirectory
      ? db.clientProfile.count({
          where: { userId: { not: user.id } },
        })
      : db.consultantProfile.count({
          where: {
            isAvailable: true,
            consentDirectory: true,
            userId: { not: user.id },
          },
        }),
  ]);

  // Fetch recent engagements
  const recentEngagements = await db.engagement.findMany({
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
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Fetch active requests
  const activeRequests = await db.request.findMany({
    where: {
      creatorId: user.id,
      status: { in: ["PUBLISHED", "MATCHING"] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const isConsultantOnly = user.role === "CONSULTANT";
  const isClient = user.role === "CLIENT" || user.role === "BOTH";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user.firstName || "there"}!
        </h1>
        <p className="text-slate-400 mt-1">
          Here&apos;s what&apos;s happening with your consultations.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              My Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{requestCount}</div>
            <p className="text-xs text-slate-500">Total created</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Engagements
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{engagementCount}</div>
            <p className="text-xs text-slate-500">Active & completed</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              {showClientsInDirectory ? "Available Clients" : "Available Consultants"}
            </CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{directoryCount}</div>
            <p className="text-xs text-slate-500">In the directory</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Your Role
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <Badge
              variant="outline"
              className={
                user.role === "BOTH"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : user.role === "CONSULTANT"
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              }
            >
              {user.role}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-400">
              Get started with these common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isClient && (
              <Link href="/app/requests/new">
                <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  Create a new request
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/app/directory">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                <Users className="mr-2 h-4 w-4" />
                {showClientsInDirectory ? "Browse clients" : "Browse consultants"}
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
            <Link href="/app/hive">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                <Calendar className="mr-2 h-4 w-4" />
                Explore Hive Mind
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Engagements */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Engagements</CardTitle>
            <CardDescription className="text-slate-400">
              Your latest consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEngagements.length === 0 ? (
              <p className="text-slate-500 text-sm">No engagements yet.</p>
            ) : (
              <div className="space-y-3">
                {recentEngagements.map((engagement) => {
                  const otherParty =
                    engagement.booking.clientId === user.id
                      ? engagement.booking.consultant
                      : engagement.booking.client;
                  return (
                    <Link
                      key={engagement.id}
                      href={`/app/engagements/${engagement.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {engagement.booking.request?.title || "Direct Booking"}
                        </p>
                        <p className="text-xs text-slate-400">
                          with {otherParty.firstName} {otherParty.lastName}
                        </p>
                      </div>
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
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Requests */}
      {isClient && activeRequests.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Active Requests</CardTitle>
            <CardDescription className="text-slate-400">
              Requests you&apos;re waiting on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/app/requests/${request.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {request.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      Created {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      request.status === "PUBLISHED"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    }
                  >
                    {request.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
