import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  FileText,
  Lightbulb,
  Copy,
  Trash2,
  Download,
  FolderOpen,
  CheckCircle2,
  Archive,
  PenLine,
  Plus,
  Link,
  ExternalLink,
} from "lucide-react";
import type { ContentPlan, Client, ShareLink } from "@shared/schema";

// ── Status Styles ──────────────────────────────────

const PLAN_STATUS_STYLES: Record<string, string> = {
  draft:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  approved:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  archived:
    "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
};

const IDEA_TYPE_STYLES: Record<string, string> = {
  video:
    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
  image:
    "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  carousel:
    "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/25",
  story:
    "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25",
  reel: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  ugc: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25",
  text_post:
    "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
};

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Stats Row ──────────────────────────────────────

function StatsRow({ plans }: { plans: ContentPlan[] }) {
  const stats = useMemo(() => {
    const totalIdeas = plans.reduce(
      (sum, p) => sum + (p.ideas?.length ?? 0),
      0,
    );
    const draft = plans.filter((p) => p.status === "draft").length;
    const approved = plans.filter((p) => p.status === "approved").length;
    const archived = plans.filter((p) => p.status === "archived").length;
    return { total: plans.length, totalIdeas, draft, approved, archived };
  }, [plans]);

  const items = [
    {
      label: "Total Plans",
      value: stats.total,
      icon: FolderOpen,
      color: "text-primary",
    },
    {
      label: "Total Ideas",
      value: stats.totalIdeas,
      icon: Lightbulb,
      color: "text-amber-500",
    },
    {
      label: "Draft",
      value: stats.draft,
      icon: PenLine,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Archived",
      value: stats.archived,
      icon: Archive,
      color: "text-slate-500",
    },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      data-testid="stats-row"
    >
      {items.map((item) => (
        <Card key={item.label} className="glass-card" data-testid={`stat-card-${item.label.toLowerCase().replace(/\s/g, "-")}`}>
          <CardContent className="flex items-center gap-3 p-4">
            <item.icon className={`h-5 w-5 flex-shrink-0 ${item.color}`} />
            <div>
              <p
                className="text-2xl font-bold tabular-nums"
                data-testid={`stat-value-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="stats-row-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Plan Card ──────────────────────────────────────

function PlanCard({
  plan,
  clientName,
  onClick,
}: {
  plan: ContentPlan;
  clientName: string;
  onClick: () => void;
}) {
  const ideaCount = plan.ideas?.length ?? 0;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={onClick}
      data-testid={`card-plan-${plan.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className="text-base font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2"
            data-testid={`text-plan-title-${plan.id}`}
          >
            {plan.title}
          </CardTitle>
          <Badge
            className={PLAN_STATUS_STYLES[plan.status] || ""}
            variant="outline"
            data-testid={`badge-plan-status-${plan.id}`}
          >
            {statusLabel(plan.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          data-testid={`text-plan-client-${plan.id}`}
        >
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{clientName}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t">
          <span
            className="text-sm font-medium"
            data-testid={`text-plan-ideas-${plan.id}`}
          >
            {ideaCount} idea{ideaCount !== 1 ? "s" : ""}
          </span>
          <span
            className="text-xs text-muted-foreground"
            data-testid={`text-plan-date-${plan.id}`}
          >
            {formatDate(plan.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanCardSkeleton() {
  return (
    <Card data-testid="skeleton-plan-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center justify-between pt-1 border-t">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Plan Detail Dialog ─────────────────────────────

function PlanDetailDialog({
  plan,
  clientName,
  open,
  onOpenChange,
}: {
  plan: ContentPlan | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [shareLink, setShareLink] = useState<string | null>(null);

  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!plan) return;
      const res = await apiRequest("POST", "/api/share", {
        type: "plan",
        resourceId: plan.id,
        clientId: plan.clientId,
      });
      return res.json() as Promise<ShareLink>;
    },
    onSuccess: (data) => {
      if (data) {
        const link = `${window.location.origin}/#/public/${data.token}`;
        setShareLink(link);
        navigator.clipboard.writeText(link);
        toast({ title: "Share link copied!", description: "Link copied to clipboard." });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!plan) return;
      const payload = {
        clientId: plan.clientId,
        title: `${plan.title} (Copy)`,
        description: plan.description,
        ideas: plan.ideas,
        status: "draft",
      };
      const res = await apiRequest("POST", "/api/content-plans", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({
        title: "Plan duplicated",
        description: "A copy has been created as a draft.",
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!plan) return;
      await apiRequest("DELETE", `/api/content-plans/${plan.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({ title: "Plan deleted" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleExport() {
    if (!plan) return;
    const ideas = plan.ideas ?? [];
    const lines = [
      `Plan: ${plan.title}`,
      `Client: ${clientName}`,
      `Status: ${statusLabel(plan.status)}`,
      `Description: ${plan.description || "—"}`,
      "",
      `Ideas (${ideas.length}):`,
      ...ideas.map(
        (idea, i) =>
          `  ${i + 1}. ${idea.title}\n     Type: ${idea.type}\n     Platform: ${idea.platform}\n     Concept: ${idea.concept}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Plan downloaded as text file." });
  }

  if (!plan) return null;

  const ideas = plan.ideas ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="dialog-plan-detail"
      >
        <DialogHeader>
          <DialogTitle data-testid="dialog-plan-title">
            {plan.title}
          </DialogTitle>
        </DialogHeader>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 items-center" data-testid="plan-detail-meta">
          <Badge
            className={PLAN_STATUS_STYLES[plan.status] || ""}
            variant="outline"
            data-testid="badge-plan-detail-status"
          >
            {statusLabel(plan.status)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Client: {clientName}
          </span>
          <span className="text-sm text-muted-foreground">
            Created: {formatDate(plan.createdAt)}
          </span>
        </div>

        {plan.description && (
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-plan-description"
          >
            {plan.description}
          </p>
        )}

        {/* Ideas List */}
        <div className="space-y-3" data-testid="plan-ideas-list">
          <h3 className="text-sm font-semibold">
            Ideas ({ideas.length})
          </h3>
          {ideas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ideas in this plan.</p>
          ) : (
            <div className="space-y-2">
              {ideas.map((idea, idx) => (
                <Card
                  key={idx}
                  className="bg-muted/40"
                  data-testid={`card-idea-${idx}`}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="text-sm font-medium"
                        data-testid={`text-idea-title-${idx}`}
                      >
                        {idea.title}
                      </span>
                      <Badge
                        className={IDEA_TYPE_STYLES[idea.type] || ""}
                        variant="outline"
                        data-testid={`badge-idea-type-${idx}`}
                      >
                        {idea.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid={`text-idea-concept-${idx}`}
                    >
                      {idea.concept}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Platform:{" "}
                      <span
                        className="font-medium text-foreground"
                        data-testid={`text-idea-platform-${idx}`}
                      >
                        {idea.platform}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex flex-wrap gap-2 pt-2 border-t"
          data-testid="plan-detail-actions"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            data-testid="button-duplicate-plan"
          >
            <Copy className="h-4 w-4 mr-1.5" />
            {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-testid="button-export-plan"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending}
            data-testid="button-share-plan"
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            {shareMutation.isPending ? "Generating..." : "Share with Client"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-delete-plan"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>

        {shareLink && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs font-medium">Client Share Link</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareLink} className="text-xs font-mono" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(shareLink); toast({ title: "Copied!" }); }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Create Plan Dialog ──────────────────────────────

function CreatePlanDialog({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Client[];
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [rawContent, setRawContent] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      // Parse raw content into structured ideas
      const lines = rawContent.split("\n").filter((l) => l.trim());
      const ideas: Array<{ title: string; type: string; concept: string; platform: string }> = [];

      for (const line of lines) {
        const trimmed = line.replace(/^[\d\-\*\.\)\s]+/, "").trim();
        if (!trimmed) continue;
        ideas.push({
          title: trimmed.slice(0, 100),
          type: "text_post",
          concept: trimmed,
          platform: "instagram",
        });
      }

      const res = await apiRequest("POST", "/api/content-plans", {
        clientId,
        title,
        description,
        ideas,
        status: "draft",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      onOpenChange(false);
      setTitle("");
      setClientId("");
      setDescription("");
      setRawContent("");
      toast({ title: "Plan created", description: "Your new plan has been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-plan">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. March Content Calendar"
              data-testid="input-plan-title"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Client *</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger data-testid="select-plan-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this plan"
              data-testid="input-plan-description"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Content / Scripts</label>
            <p className="text-xs text-muted-foreground mb-2">
              Paste in your scripts, content ideas, or any text. Each line becomes a separate idea.
            </p>
            <Textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder={"Post 1: Behind the scenes at the studio\nPost 2: Client testimonial video\nPost 3: Tips for social media growth\n..."}
              rows={10}
              className="font-mono text-sm"
              data-testid="textarea-plan-content"
            />
            {rawContent.trim() && (
              <p className="text-xs text-muted-foreground mt-1">
                {rawContent.split("\n").filter((l) => l.trim()).length} items detected
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || !clientId || createMutation.isPending}
              data-testid="button-create-plan"
            >
              {createMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────

export default function SavedPlans() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery<ContentPlan[]>({
    queryKey: ["/api/content-plans"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    (clients ?? []).forEach((c) => {
      map[c.id] = c.businessName;
    });
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    return (plans ?? []).filter((p) => {
      const matchSearch =
        !search || p.title.toLowerCase().includes(search.toLowerCase());
      const matchClient =
        clientFilter === "all" || p.clientId === clientFilter;
      const matchStatus =
        statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchClient && matchStatus;
    });
  }, [plans, search, clientFilter, statusFilter]);

  function openDetail(plan: ContentPlan) {
    setSelectedPlan(plan);
    setDetailOpen(true);
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="page-saved-plans">
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">
              Saved Plans
            </h1>
            <p className="text-sm text-muted-foreground">Browse and manage content plans</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-new-plan">
            <Plus className="h-4 w-4 mr-1.5" />
            New Plan
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] space-y-8 px-4 py-5 md:px-6 md:py-8">
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Snapshot
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Content plan volume and approval status
            </h2>
          </div>
          {plansLoading ? (
            <StatsRowSkeleton />
          ) : (
            <StatsRow plans={plans ?? []} />
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Library
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Filter, review, and share saved plans
            </h2>
          </div>
          <div
            className="flex flex-col gap-3 sm:flex-row"
            data-testid="filter-bar"
          >
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-plans"
              />
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger
                className="w-[200px]"
                data-testid="select-filter-client"
              >
                <SelectValue placeholder="All clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-[160px]"
                data-testid="select-filter-status"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

        {plansLoading ? (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            data-testid="grid-plans-loading"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            data-testid="empty-state-plans"
          >
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {plans && plans.length > 0
                ? "No plans match your filters"
                : "No saved plans yet"}
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {plans && plans.length > 0
                ? "Try adjusting your search or filters."
                : "Plans created in the AI Planner will appear here."}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            data-testid="grid-plans"
          >
            {filtered.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                clientName={clientMap[plan.clientId] || "Unknown"}
                onClick={() => openDetail(plan)}
              />
            ))}
          </div>
        )}
        </section>
      </div>

      <PlanDetailDialog
        plan={selectedPlan}
        clientName={
          selectedPlan ? clientMap[selectedPlan.clientId] || "Unknown" : ""
        }
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <CreatePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients ?? []}
      />
    </div>
  );
}
