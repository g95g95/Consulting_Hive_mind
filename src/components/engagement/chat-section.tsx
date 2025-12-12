"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Lock } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  isSystem: boolean;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

export function ChatSection({
  engagementId,
  messages,
  currentUserId,
  isLocked,
}: {
  engagementId: string;
  messages: Message[];
  currentUserId: string;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || isLocked) return;

    setSending(true);
    try {
      const response = await fetch(`/api/engagements/${engagementId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      router.refresh();
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white">Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMe = message.author.id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={message.author.imageUrl || undefined} />
                      <AvatarFallback className="bg-slate-700 text-white text-xs">
                        {message.author.firstName?.[0]}
                        {message.author.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[70%] ${
                        isMe ? "bg-amber-500/20" : "bg-slate-700/50"
                      } rounded-lg p-3`}
                    >
                      <p className="text-sm text-white whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {isLocked ? (
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <Lock className="h-4 w-4 text-slate-500" />
            <p className="text-sm text-slate-500">Chat is locked until payment is completed</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="bg-slate-700 border-slate-600 text-white min-h-[60px]"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
