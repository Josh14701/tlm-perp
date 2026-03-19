import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Plus,
  Trash2,
  Sparkles,
  Save,
  MessageSquare,
  Video,
  PenLine,
  CalendarDays,
  LayoutGrid,
  Bot,
  User,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Client, AiSession } from "@shared/schema";

// ── Types ──────────────────────────────────────────────
interface ChatMessage {
  role: string;
  content: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
}

// ── Quick Actions ──────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: "Generate Video Ideas",
    icon: Video,
    prompt:
      "Generate 5 creative video content ideas for this client, including concepts, hooks, and recommended platforms.",
  },
  {
    label: "Write Captions",
    icon: PenLine,
    prompt:
      "Write 5 engaging social media captions for this client. Include relevant hashtags and a strong CTA for each.",
  },
  {
    label: "Plan This Week",
    icon: CalendarDays,
    prompt:
      "Create a 7-day content plan for this client. Include content type, platform, topic, and suggested posting time for each day.",
  },
  {
    label: "Carousel Outline",
    icon: LayoutGrid,
    prompt:
      "Create a detailed carousel post outline (8-10 slides) for this client. Include a hook slide, value slides, and a CTA slide.",
  },
];

// ── Session List Item ──────────────────────────────────
function SessionItem({
  session,
  isActive,
  clientName,
  onSelect,
  onDelete,
}: {
  session: AiSession;
  isActive: boolean;
  clientName: string;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-testid={`session-item-${session.id}`}
      className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/60 border border-transparent"
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight" data-testid={`session-title-${session.id}`}>
          {session.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground truncate">
            {clientName}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {session.createdAt
              ? new Date(session.createdAt).toLocaleDateString("en-AU", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
      </div>
      <button
        data-testid={`delete-session-${session.id}`}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="Delete session"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Typing Indicator ───────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-[85%]" data-testid="typing-indicator">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted/60 border border-border/50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// ── Chat Message Bubble ────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
      data-testid={`chat-message-${message.role}`}
    >
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted/60 border border-border/50 text-foreground"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold prose-pre:bg-background/50 prose-pre:border prose-pre:border-border/50 prose-code:text-primary prose-code:font-mono prose-code:text-xs">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function ContentPlanner() {
  const { toast } = useToast();

  // State
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [provider, setProvider] = useState("openai");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──────────────────────────────────────────
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<AiSession[]>(
    {
      queryKey: ["/api/ai-sessions"],
    }
  );

  // ── Load Session ─────────────────────────────────────
  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const res = await apiRequest("GET", `/api/ai-sessions/${sessionId}`);
        const session: AiSession = await res.json();
        setActiveSessionId(session.id);
        setMessages(session.messages || []);
        if (session.clientId) {
          setSelectedClientId(session.clientId);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load session",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // ── Send Message Mutation ────────────────────────────
  const sendMessageMutation = useMutation<ChatResponse, Error, { message: string }>({
    mutationFn: async ({ message }) => {
      const res = await apiRequest("POST", "/api/ai/chat", {
        clientId: selectedClientId,
        message,
        sessionId: activeSessionId || undefined,
        provider,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
      if (!activeSessionId) {
        setActiveSessionId(data.sessionId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/ai-sessions"] });
    },
    onError: (error) => {
      // Remove the optimistic user message
      setMessages((prev) => prev.slice(0, -1));
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // ── Delete Session Mutation ──────────────────────────
  const deleteSessionMutation = useMutation<void, Error, string>({
    mutationFn: async (sessionId) => {
      await apiRequest("DELETE", `/api/ai-sessions/${sessionId}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-sessions"] });
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast({ title: "Session deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    },
  });

  // ── Save Plan Mutation ───────────────────────────────
  const savePlanMutation = useMutation({
    mutationFn: async () => {
      // Extract ideas from AI messages
      const aiMessages = messages.filter((m) => m.role === "assistant");
      const ideas = aiMessages.map((m, i) => ({
        title: `Idea ${i + 1}`,
        type: "mixed",
        concept: m.content.slice(0, 500),
        platform: "multi-platform",
      }));

      await apiRequest("POST", "/api/content-plans", {
        clientId: selectedClientId,
        title: planTitle,
        description: planDescription,
        ideas,
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      setSaveDialogOpen(false);
      setPlanTitle("");
      setPlanDescription("");
      toast({ title: "Plan saved", description: "Your content plan has been saved as a draft." });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    },
  });

  // ── Handlers ─────────────────────────────────────────
  const handleSendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !selectedClientId || sendMessageMutation.isPending) return;

      // Add user message optimistically
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInputValue("");
      sendMessageMutation.mutate({ message: trimmed });
    },
    [selectedClientId, sendMessageMutation]
  );

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInputValue("");
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputValue);
      }
    },
    [handleSendMessage, inputValue]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

  // ── Derived ──────────────────────────────────────────
  const clientMap = new Map(
    (clients || []).map((c) => [c.id, c.businessName])
  );

  const filteredSessions = (sessions || []).filter(
    (s) => !selectedClientId || s.clientId === selectedClientId
  );

  const selectedClient = clients?.find((c) => c.id === selectedClientId);
  const hasAiMessages = messages.some((m) => m.role === "assistant");

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="page-ai-planner">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-6 py-3 shrink-0">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold" data-testid="page-title">
            AI Content Planner
          </h1>
        </div>
        <div className="flex-1" />
        {hasAiMessages && selectedClientId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            data-testid="button-save-plan"
          >
            <Save className="h-4 w-4 mr-2" />
            Save to Plan
          </Button>
        )}
      </header>

      {/* Body: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ────────────────────────────── */}
        <aside className="w-[300px] border-r flex flex-col shrink-0 bg-card/30" data-testid="sessions-sidebar">
          {/* Client Selector */}
          <div className="p-3 border-b space-y-2">
            <Select
              value={selectedClientId}
              onValueChange={(val) => {
                setSelectedClientId(val);
                setActiveSessionId(null);
                setMessages([]);
              }}
            >
              <SelectTrigger data-testid="select-client" className="w-full">
                <SelectValue placeholder="Select a client…" />
              </SelectTrigger>
              <SelectContent>
                {clientsLoading ? (
                  <div className="p-2">
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  (clients || []).map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id}
                      data-testid={`client-option-${client.id}`}
                    >
                      {client.businessName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleNewChat}
              disabled={!selectedClientId}
              data-testid="button-new-chat"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Session List */}
          <ScrollArea className="flex-1" data-testid="sessions-list">
            <div className="p-2 space-y-1">
              {sessionsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-3 py-2.5 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : filteredSessions.length === 0 ? (
                <div className="px-3 py-8 text-center" data-testid="empty-sessions">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {selectedClientId
                      ? "No conversations yet"
                      : "Select a client to see sessions"}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={activeSessionId === session.id}
                    clientName={clientMap.get(session.clientId) || "Unknown"}
                    onSelect={() => loadSession(session.id)}
                    onDelete={() => deleteSessionMutation.mutate(session.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* ── Main Chat Area ────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden" data-testid="chat-area">
          {!selectedClientId ? (
            /* Empty State: No client */
            <div className="flex-1 flex items-center justify-center" data-testid="empty-state-no-client">
              <div className="text-center max-w-sm">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Select a client to start</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Choose a client from the sidebar to begin generating content ideas. The AI will use their knowledge base for context-aware suggestions.
                </p>
              </div>
            </div>
          ) : messages.length === 0 && !sendMessageMutation.isPending ? (
            /* Empty State: No messages */
            <div className="flex-1 flex items-center justify-center" data-testid="empty-state-no-messages">
              <div className="text-center max-w-md">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  Chat with AI for {selectedClient?.businessName}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Ask me anything about content strategy, ideas, captions, or planning. I have context about this client's brand and audience.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors"
                      onClick={() => handleSendMessage(action.prompt)}
                    >
                      <action.icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <ScrollArea className="flex-1" data-testid="chat-messages">
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {messages.map((msg, i) => (
                  <ChatBubble key={i} message={msg} />
                ))}
                {sendMessageMutation.isPending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* ── Input Area ──────────────────────────── */}
          {selectedClientId && (
            <div className="border-t bg-card/50 px-4 py-3 shrink-0" data-testid="chat-input-area">
              {/* Quick actions row (shown when there are messages) */}
              {messages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 max-w-3xl mx-auto" data-testid="quick-actions-bar">
                  {QUICK_ACTIONS.map((action) => (
                    <Badge
                      key={action.label}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted/60 transition-colors whitespace-nowrap py-1 px-2.5 text-xs font-normal"
                      data-testid={`quick-badge-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => handleSendMessage(action.prompt)}
                    >
                      <action.icon className="h-3 w-3 mr-1.5" />
                      {action.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="w-[110px] h-9 text-xs shrink-0" data-testid="select-ai-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">GPT-4o</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      sendMessageMutation.isPending
                        ? "AI is thinking…"
                        : "Ask about content ideas, captions, strategy…"
                    }
                    disabled={sendMessageMutation.isPending}
                    className="pr-12"
                    data-testid="input-chat-message"
                  />
                </div>
                <Button
                  size="icon"
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={
                    !inputValue.trim() || sendMessageMutation.isPending
                  }
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Save to Plan Dialog ─────────────────────── */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent data-testid="dialog-save-plan">
          <DialogHeader>
            <DialogTitle>Save as Content Plan</DialogTitle>
            <DialogDescription>
              Save the ideas from this conversation as a content plan draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="plan-title">
                Plan Title
              </label>
              <Input
                id="plan-title"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                placeholder="e.g. March Week 3 Content Plan"
                data-testid="input-plan-title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="plan-description">
                Description
              </label>
              <Input
                id="plan-description"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Brief description of this plan…"
                data-testid="input-plan-description"
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1.5">
                Ideas to be saved
              </p>
              <p className="text-sm font-medium" data-testid="text-ideas-count">
                {messages.filter((m) => m.role === "assistant").length} AI
                response{messages.filter((m) => m.role === "assistant").length !== 1 ? "s" : ""}{" "}
                will be extracted as plan ideas
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                data-testid="button-cancel-save"
              >
                Cancel
              </Button>
              <Button
                onClick={() => savePlanMutation.mutate()}
                disabled={!planTitle.trim() || savePlanMutation.isPending}
                data-testid="button-confirm-save"
              >
                {savePlanMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Plan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
