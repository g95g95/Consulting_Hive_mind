import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { BookOpen, Sparkles, Layers, Plus, Lock } from "lucide-react";

export default async function HiveMindPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  // Fetch approved patterns, prompts, and stacks
  const [patterns, prompts, stacks] = await Promise.all([
    db.pattern.findMany({
      where: { status: "APPROVED" },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.prompt.findMany({
      where: { status: "APPROVED" },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.stackTemplate.findMany({
      where: { status: "APPROVED" },
      include: { creator: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hive Mind</h1>
          <p className="text-slate-400 mt-1">
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

      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="patterns" className="data-[state=active]:bg-slate-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Patterns ({patterns.length})
          </TabsTrigger>
          <TabsTrigger value="prompts" className="data-[state=active]:bg-slate-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Prompts ({prompts.length})
          </TabsTrigger>
          <TabsTrigger value="stacks" className="data-[state=active]:bg-slate-700">
            <Layers className="h-4 w-4 mr-2" />
            Stacks ({stacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {patterns.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No patterns yet</p>
                <p className="text-sm text-slate-500">
                  Be the first to contribute an architectural pattern!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {patterns.map((pattern) => (
                <Card key={pattern.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white">{pattern.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {pattern.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded-lg overflow-x-auto max-h-40">
                      {pattern.content.slice(0, 500)}
                      {pattern.content.length > 500 && "..."}
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {pattern.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Contributed by {pattern.creator.firstName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          {prompts.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No prompts yet</p>
                <p className="text-sm text-slate-500">
                  Share your favorite prompts with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {prompts.map((prompt) => (
                <Card key={prompt.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white">{prompt.title}</CardTitle>
                    {prompt.useCase && (
                      <CardDescription className="text-slate-400">
                        Use case: {prompt.useCase}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {prompt.content.slice(0, 500)}
                      {prompt.content.length > 500 && "..."}
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {prompt.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stacks" className="space-y-4">
          {stacks.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-12 text-center">
                <Layers className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No stack templates yet</p>
                <p className="text-sm text-slate-500">
                  Share your recommended technology stacks!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stacks.map((stack) => (
                <Card key={stack.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white">{stack.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {stack.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm text-slate-300 bg-slate-700/30 p-3 rounded-lg overflow-x-auto max-h-40 whitespace-pre-wrap">
                      {stack.content.slice(0, 500)}
                      {stack.content.length > 500 && "..."}
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {stack.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-slate-600 text-slate-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
