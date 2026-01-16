import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, CreditCard, BookOpen, Shield } from "lucide-react";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/app");
  }

  // Fetch stats
  const [
    userCount,
    requestCount,
    engagementCount,
    paymentCount,
    pendingPatterns,
    pendingPrompts,
    pendingStacks,
    recentAuditLogs,
  ] = await Promise.all([
    db.user.count(),
    db.request.count(),
    db.engagement.count(),
    db.payment.count({ where: { status: "SUCCEEDED" } }),
    db.pattern.count({ where: { status: "PENDING_REVIEW" } }),
    db.prompt.count({ where: { status: "PENDING_REVIEW" } }),
    db.stackTemplate.count({ where: { status: "PENDING_REVIEW" } }),
    db.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const pendingContributions = pendingPatterns + pendingPrompts + pendingStacks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-500" />
          Admin Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Platform overview and moderation tools
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{userCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Requests</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{requestCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{paymentCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Review</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingContributions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="audit" className="data-[state=active]:bg-slate-700">
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="moderation" className="data-[state=active]:bg-slate-700">
            Moderation Queue ({pendingContributions})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-slate-400">
                Last 50 actions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {log.action}
                      </Badge>
                      <span className="text-sm text-slate-400">
                        {log.entity} {log.entityId && `#${log.entityId.slice(0, 8)}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">
                        {log.user?.firstName || "System"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Pending Contributions</CardTitle>
              <CardDescription className="text-slate-400">
                Hive Mind contributions awaiting review ({pendingPatterns} patterns, {pendingPrompts} prompts, {pendingStacks} stacks)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModerationQueue />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
