"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Lock, Eye, EyeOff } from "lucide-react";

interface Note {
  id: string;
  title: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export function NotesSection({
  engagementId,
  notes,
  currentUserId,
  isLocked,
}: {
  engagementId: string;
  notes: Note[];
  currentUserId: string;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || saving || isLocked) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/engagements/${engagementId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isPrivate }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      setTitle("");
      setContent("");
      setIsPrivate(false);
      setShowForm(false);
      router.refresh();
    } catch (error) {
      console.error("Save note error:", error);
    } finally {
      setSaving(false);
    }
  };

  // Filter notes - show all own notes, only public notes from others
  const visibleNotes = notes.filter(
    (note) => note.author.id === currentUserId || !note.isPrivate
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-white">Notes</CardTitle>
        {!isLocked && !showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <Lock className="h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-500">Notes are locked until payment is completed</p>
          </div>
        )}

        {showForm && (
          <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg">
            <Input
              placeholder="Note title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Textarea
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPrivate(!isPrivate)}
                className="text-slate-400"
              >
                {isPrivate ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Private (only you)
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Shared with participant
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-slate-400"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!content.trim() || saving}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {visibleNotes.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {visibleNotes.map((note) => (
              <div key={note.id} className="p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {note.title && (
                      <h4 className="font-medium text-white">{note.title}</h4>
                    )}
                    <p className="text-xs text-slate-500">
                      {note.author.firstName} {note.author.lastName} &middot;{" "}
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {note.isPrivate && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
