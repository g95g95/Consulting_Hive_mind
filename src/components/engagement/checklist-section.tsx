"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Lock, Trash2 } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  order: number;
}

export function ChecklistSection({
  engagementId,
  items,
  isLocked,
}: {
  engagementId: string;
  items: ChecklistItem[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newItem.trim() || adding || isLocked) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/engagements/${engagementId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newItem }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      setNewItem("");
      router.refresh();
    } catch (error) {
      console.error("Add checklist item error:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    if (isLocked || updating) return;

    setUpdating(item.id);
    try {
      const response = await fetch(
        `/api/engagements/${engagementId}/checklist/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted: !item.isCompleted }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      router.refresh();
    } catch (error) {
      console.error("Update checklist item error:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (isLocked || updating) return;

    setUpdating(itemId);
    try {
      const response = await fetch(
        `/api/engagements/${engagementId}/checklist/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      router.refresh();
    } catch (error) {
      console.error("Delete checklist item error:", error);
    } finally {
      setUpdating(null);
    }
  };

  const completedCount = items.filter((i) => i.isCompleted).length;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Checklist</CardTitle>
          {items.length > 0 && (
            <span className="text-sm text-slate-400">
              {completedCount}/{items.length} completed
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLocked && (
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <Lock className="h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-500">Checklist is locked until payment is completed</p>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No checklist items yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg group"
              >
                <Checkbox
                  checked={item.isCompleted}
                  onCheckedChange={() => handleToggle(item)}
                  disabled={isLocked || updating === item.id}
                  className="border-slate-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <span
                  className={`flex-1 text-sm ${
                    item.isCompleted ? "text-slate-500 line-through" : "text-white"
                  }`}
                >
                  {item.text}
                </span>
                {!isLocked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={updating === item.id}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1 h-auto"
                  >
                    {updating === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLocked && (
          <div className="flex gap-2">
            <Input
              placeholder="Add a checklist item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleAdd}
              disabled={!newItem.trim() || adding}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
