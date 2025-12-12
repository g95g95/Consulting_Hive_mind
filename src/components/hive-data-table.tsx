"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Lightbulb,
  MessageSquare,
  Layers,
  User,
  Users,
  BookOpen,
} from "lucide-react";

interface Creator {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface PatternItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string | null;
  tags: string[];
  status: string;
  creator: Creator;
  creatorId: string;
}

interface PromptItem {
  id: string;
  title: string;
  description: string;
  content: string;
  useCase: string | null;
  tags: string[];
  status: string;
  creator: Creator;
  creatorId: string;
}

interface StackItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string | null;
  tags: string[];
  uiTech: string | null;
  backendTech: string | null;
  databaseTech: string | null;
  releaseTech: string | null;
  status: string;
  creator: Creator;
  creatorId: string;
}

interface EngagementItem {
  id: string;
  type: "engagement" | "standalone";
  title: string;
  description: string;
  clientName: string;
  consultantName: string;
  clientId: string | null;
  consultantId: string | null;
  createdAt: Date;
  patterns: PatternItem[];
  prompts: PromptItem[];
  stacks: StackItem[];
}

interface HiveDataTableProps {
  items: EngagementItem[];
  currentUserId: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
        Approved
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
      Pending Review
    </Badge>
  );
}

export function HiveDataTable({ items, currentUserId }: HiveDataTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.clientName.toLowerCase().includes(query) ||
      item.consultantName.toLowerCase().includes(query) ||
      item.patterns.some((p) => p.title.toLowerCase().includes(query)) ||
      item.prompts.some((p) => p.title.toLowerCase().includes(query)) ||
      item.stacks.some((s) => s.title.toLowerCase().includes(query))
    );
  });

  const getCreatorName = (creator: Creator, creatorId: string) => {
    const name = `${creator.firstName || ""} ${creator.lastName || ""}`.trim() || "Anonymous";
    return creatorId === currentUserId ? `${name} (You)` : name;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems, patterns, prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? "entry" : "entries"}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
          <div className="col-span-1"></div>
          <div className="col-span-4">Problem / Title</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Consultant</div>
        </div>

        {/* Rows */}
        {filteredItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No contributions found.</p>
            <p className="text-sm mt-1">Be the first to contribute to the Hive Mind!</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="border-b border-border last:border-b-0">
              {/* Main Row */}
              <div
                className="grid grid-cols-12 gap-4 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="col-span-1 flex items-center">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedId === item.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  {item.type === "standalone" ? (
                    <BookOpen className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium text-foreground truncate">{item.title}</span>
                  <div className="flex items-center gap-1 ml-2">
                    {item.patterns.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5">
                        {item.patterns.length} P
                      </Badge>
                    )}
                    {item.prompts.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5">
                        {item.prompts.length} Pr
                      </Badge>
                    )}
                    {item.stacks.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5">
                        {item.stacks.length} S
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-3 flex items-center">
                  <span className="text-muted-foreground text-sm truncate">{item.description}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className={item.clientId === currentUserId ? "text-amber-400" : "text-foreground"}>
                    {item.clientName}
                    {item.clientId === currentUserId && " (You)"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-1 text-sm">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className={item.consultantId === currentUserId ? "text-amber-400" : "text-foreground"}>
                    {item.consultantName}
                    {item.consultantId === currentUserId && " (You)"}
                  </span>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div className="px-4 pb-4 bg-muted/20">
                  <Tabs defaultValue="patterns" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="patterns" className="gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Patterns ({item.patterns.length})
                      </TabsTrigger>
                      <TabsTrigger value="prompts" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Prompts ({item.prompts.length})
                      </TabsTrigger>
                      <TabsTrigger value="stacks" className="gap-2">
                        <Layers className="h-4 w-4" />
                        Stacks ({item.stacks.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Patterns Tab */}
                    <TabsContent value="patterns" className="space-y-3">
                      {item.patterns.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No patterns for this engagement yet.
                        </p>
                      ) : (
                        item.patterns.map((pattern) => (
                          <Card key={pattern.id} className="bg-background">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-foreground">{pattern.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    by {getCreatorName(pattern.creator, pattern.creatorId)}
                                    {pattern.category && ` · ${pattern.category}`}
                                  </p>
                                </div>
                                <StatusBadge status={pattern.status} />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                              <div className="bg-muted/50 rounded p-3 text-sm whitespace-pre-wrap">
                                {pattern.content}
                              </div>
                              {pattern.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {pattern.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Prompts Tab */}
                    <TabsContent value="prompts" className="space-y-3">
                      {item.prompts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No prompts for this engagement yet.
                        </p>
                      ) : (
                        item.prompts.map((prompt) => (
                          <Card key={prompt.id} className="bg-background">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-foreground">{prompt.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    by {getCreatorName(prompt.creator, prompt.creatorId)}
                                    {prompt.useCase && ` · ${prompt.useCase}`}
                                  </p>
                                </div>
                                <StatusBadge status={prompt.status} />
                              </div>
                              {prompt.description && (
                                <p className="text-sm text-muted-foreground mb-3">{prompt.description}</p>
                              )}
                              <div className="bg-muted/50 rounded p-3 text-sm font-mono whitespace-pre-wrap">
                                {prompt.content}
                              </div>
                              {prompt.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {prompt.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Stacks Tab */}
                    <TabsContent value="stacks" className="space-y-3">
                      {item.stacks.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No stacks for this engagement yet.
                        </p>
                      ) : (
                        item.stacks.map((stack) => (
                          <Card key={stack.id} className="bg-background">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-foreground">{stack.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    by {getCreatorName(stack.creator, stack.creatorId)}
                                    {stack.category && ` · ${stack.category}`}
                                  </p>
                                </div>
                                <StatusBadge status={stack.status} />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{stack.description}</p>

                              {/* Tech Stack Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                {stack.uiTech && (
                                  <div className="bg-muted/50 rounded p-2">
                                    <p className="text-xs text-muted-foreground">UI/Frontend</p>
                                    <p className="text-sm font-medium text-foreground">{stack.uiTech}</p>
                                  </div>
                                )}
                                {stack.backendTech && (
                                  <div className="bg-muted/50 rounded p-2">
                                    <p className="text-xs text-muted-foreground">Backend</p>
                                    <p className="text-sm font-medium text-foreground">{stack.backendTech}</p>
                                  </div>
                                )}
                                {stack.databaseTech && (
                                  <div className="bg-muted/50 rounded p-2">
                                    <p className="text-xs text-muted-foreground">Database</p>
                                    <p className="text-sm font-medium text-foreground">{stack.databaseTech}</p>
                                  </div>
                                )}
                                {stack.releaseTech && (
                                  <div className="bg-muted/50 rounded p-2">
                                    <p className="text-xs text-muted-foreground">Release</p>
                                    <p className="text-sm font-medium text-foreground">{stack.releaseTech}</p>
                                  </div>
                                )}
                              </div>

                              <div className="bg-muted/50 rounded p-3 text-sm whitespace-pre-wrap">
                                {stack.content}
                              </div>
                              {stack.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {stack.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
