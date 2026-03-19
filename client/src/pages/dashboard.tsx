import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow, parse, format } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  ListTodo,
  Activity,
  Target,
  UserPlus,
  UserMinus,
  Pause,
  FileText,
  Image,
  MessageSquare,
  Zap,
  BarChart3,
  Pencil,
  Plus,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, ActivityLog, RevenueGoal } from "@shared/schema";

// ── Types ──────────────────────────────────────────────
interface DashboardData {
  totalMRR: number;
  clientCounts: {
    active: number;
    onboarding: number;
    paused: number;
    churned: number;
    total: number;
  };
  pipelineValue: number;
  recentActivity: ActivityLog[];
  topClientsByMRR: Client[];
  taskCompletionStats: {
    todo: number;
    in_progress: number;
    complete: number;
    total: number;
  };
  revenueGoals: RevenueGoal[];
}

// ── Helpers ────────────────────────────────────────────
const formatAUD = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  onboarding: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  churned: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

const statusBarColor: Record<string, string> = {
  active: "bg-emerald-500",
  onboarding: "bg-sky-500",
  paused: "bg-amber-500",
  churned: "bg-rose-500",
};

function getActivityIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("client")) return <Users className="h-4 w-4" />;
  if (lower.includes("task")) return <ListTodo className="h-4 w-4" />;
  if (lower.includes("content") || lower.includes("post")) return <FileText className="h-4 w-4" />;
  if (lower.includes("image")) return <Image className="h-4 w-4" />;
  if (lower.includes("lead") || lower.includes("pipeline")) return <TrendingUp className="h-4 w-4" />;
  if (lower.includes("message") || lower.includes("comment")) return <MessageSquare className="h-4 w-4" />;
  if (lower.includes("analytic")) return <BarChart3 className="h-4 w-4" />;
  return <Zap className="h-4 w-4" />;
}

// ── KPI card config ────────────────────────────────────
const kpiGradients = [
  "from-orange-500/12 to-amber-500/8",
  "from-violet-500/12 to-purple-500/8",
  "from-rose-500/12 to-pink-500/8",
  "from-emerald-500/12 to-teal-500/8",
];

const kpiIconColors = [
  "text-orange-600 dark:text-orange-400 bg-orange-500/12",
  "text-violet-600 dark:text-violet-400 bg-violet-500/12",
  "text-rose-600 dark:text-rose-400 bg-rose-500/12",
  "text-emerald-600 dark:text-emerald-400 bg-emerald-500/12",
];

// ── Progress Ring (SVG donut) ──────────────────────────
function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 10,
  color = "hsl(var(--primary))",
  trackColor = "hsl(var(--muted))",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Skeleton Loaders ───────────────────────────────────
function KPISkeleton() {
  return (
    <Card className="overflow-hidden glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Revenue Goal Dialog ────────────────────────────────
function RevenueGoalDialog({
  open,
  onOpenChange,
  editingGoal,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingGoal: RevenueGoal | null;
}) {
  const isEditing = !!editingGoal;
  const [type, setType] = useState(editingGoal?.type ?? "monthly");
  const [target, setTarget] = useState(editingGoal?.target?.toString() ?? "");
  const [period, setPeriod] = useState(editingGoal?.period ?? "");

  useEffect(() => {
    setType(editingGoal?.type ?? "monthly");
    setTarget(editingGoal?.target?.toString() ?? "");
    setPeriod(editingGoal?.period ?? "");
  }, [editingGoal, open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/revenue-goals", {
        type,
        target: parseFloat(target),
        period,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/revenue-goals/${editingGoal!.id}`, {
        type,
        target: parseFloat(target),
        period,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/revenue-goals/${editingGoal!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Revenue Goal" : "Add Revenue Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target (AUD)</label>
            <Input
              type="number"
              min={0}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Period</label>
            <Input
              value={period || defaultPeriod}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. 2026-03, 2026-Q1, 2026"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: YYYY-MM (monthly), YYYY-Q1 (quarterly), YYYY (yearly)
            </p>
          </div>
          <div className="flex justify-between pt-2">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !target || !period}>
                {isPending ? "Saving..." : isEditing ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Dashboard ─────────────────────────────────────
export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<RevenueGoal | null>(null);

  const taskTotal = data?.taskCompletionStats.total ?? 0;
  const taskComplete = data?.taskCompletionStats.complete ?? 0;
  const taskPct = taskTotal > 0 ? Math.round((taskComplete / taskTotal) * 100) : 0;

  const monthlyGoal = data?.revenueGoals?.find((g) => g.type === "monthly");
  const goalTarget = monthlyGoal?.target ?? 0;
  const goalPct = goalTarget > 0 ? Math.round(((data?.totalMRR ?? 0) / goalTarget) * 100) : 0;

  const clientPieData = data
    ? [
        { name: "Active", value: data.clientCounts.active, fill: "#10b981" },
        { name: "Onboarding", value: data.clientCounts.onboarding, fill: "#0ea5e9" },
        { name: "Paused", value: data.clientCounts.paused, fill: "#f59e0b" },
        { name: "Churned", value: data.clientCounts.churned, fill: "#f43f5e" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex-1 overflow-auto" data-testid="page-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[1460px] items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger data-testid="sidebar-trigger" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/70">
                Executive overview
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] md:text-3xl" data-testid="page-title">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back - here&apos;s your agency overview
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <div className="glass-pill rounded-full px-4 py-2 text-sm text-muted-foreground">
              {data?.clientCounts.total ?? 0} clients in workspace
            </div>
            <div className="glass-pill rounded-full px-4 py-2 text-sm font-medium text-foreground">
              {monthlyGoal ? `${goalPct}% to monthly target` : "Set your monthly target"}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] space-y-8 px-4 py-5 md:px-6 md:py-8">
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <Card className="glass-card overflow-hidden" data-testid="dashboard-hero">
            <CardContent className="p-7 md:p-9">
              <div className="grid gap-8 lg:grid-cols-[1.3fr_0.95fr] lg:items-start">
                <div className="space-y-7">
                  <div className="space-y-4">
                    <Badge variant="outline" className="border-white/50 bg-white/45 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700 dark:text-slate-200">
                      Agency cockpit
                    </Badge>
                    <div className="space-y-3">
                      <h2 className="max-w-[12ch] text-3xl font-semibold leading-[0.92] tracking-[-0.05em] text-slate-900 md:text-5xl dark:text-white">
                        Your agency at a glance.
                      </h2>
                      <p className="max-w-[58ch] text-sm leading-7 text-muted-foreground md:text-[15px]">
                        Track revenue momentum, delivery health, and client activity from a single frosted workspace built for fast daily check-ins.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[26px] border border-white/30 bg-white/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                        Monthly recurring
                      </p>
                      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
                        {formatAUD(data?.totalMRR ?? 0)}
                      </p>
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        Stable retained revenue
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-white/30 bg-white/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                        Pipeline
                      </p>
                      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
                        {formatAUD(data?.pipelineValue ?? 0)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Open proposals in play
                      </p>
                    </div>
                    <div className="rounded-[26px] border border-white/30 bg-white/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                        Delivery health
                      </p>
                      <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] tabular-nums">
                        {taskPct}%
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tasks completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-white/30 bg-white/18 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                          Goal tracking
                        </p>
                        <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
                          {monthlyGoal ? "Monthly target progress" : "No monthly goal yet"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {monthlyGoal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl"
                            onClick={() => {
                              setEditingGoal(monthlyGoal);
                              setGoalDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => {
                            setEditingGoal(monthlyGoal ?? null);
                            setGoalDialogOpen(true);
                          }}
                        >
                          {monthlyGoal ? <Plus className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/50 dark:bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-slate-900 via-sky-500 to-cyan-400 transition-all duration-500 dark:from-slate-100 dark:via-sky-400 dark:to-cyan-300"
                        style={{ width: `${Math.min(goalPct, 100)}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {monthlyGoal ? `${goalPct}% achieved` : "Create a target to unlock tracking"}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatAUD(goalTarget)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      {monthlyGoal ? "Edit or replace your target directly from here." : "Create a goal to start tracking revenue progress."}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/30 bg-white/16 p-5 backdrop-blur-xl">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                        <Users className="h-4 w-4 text-violet-500" />
                        Active clients
                      </div>
                      <p className="mt-4 text-2xl font-semibold tabular-nums">
                        {data?.clientCounts.active ?? 0}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/30 bg-white/16 p-5 backdrop-blur-xl">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                        <ListTodo className="h-4 w-4 text-sky-500" />
                        Tasks tracked
                      </div>
                      <p className="mt-4 text-2xl font-semibold tabular-nums">
                        {taskTotal}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card glass-dark-card overflow-hidden text-white" data-testid="dashboard-live-panel">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    Live Pulse
                  </CardTitle>
                  <p className="mt-1 text-sm text-white/60">
                    Most recent work happening across the studio
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-2 text-white/80">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Revenue run rate
                  </p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                    {formatAUD(data?.totalMRR ?? 0)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Pipeline coverage
                  </p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                    {formatAUD(data?.pipelineValue ?? 0)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    Task completion
                  </p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                    {taskPct}%
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {isLoading
                  ? Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.8)]" />
                        <div className="min-w-0 flex-1">
                          <Skeleton className="h-4 w-full rounded-full bg-white/10" />
                          <Skeleton className="mt-2 h-3 w-24 rounded-full bg-white/10" />
                        </div>
                      </div>
                    ))
                  : (data?.recentActivity?.slice(0, 3) ?? []).map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.8)]" />
                        <div className="min-w-0">
                          <p className="text-sm leading-6 text-white/90">
                            {item.description}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            {item.createdAt
                              ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                              : "just now"}
                          </p>
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Snapshot
            </p>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Core operating metrics
            </h3>
          </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="kpi-row">
          {isLoading ? (
            <>
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
            </>
          ) : (
            <>
              {/* Total MRR */}
              <Card className={`overflow-hidden relative glass-card`} data-testid="kpi-total-mrr">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpiGradients[0]} pointer-events-none`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total MRR
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpiIconColors[0]}`}>
                    <DollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold tabular-nums" data-testid="value-total-mrr">
                    {formatAUD(data?.totalMRR ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                    from {data?.clientCounts.active ?? 0} active clients
                  </p>
                </CardContent>
              </Card>

              {/* Active Clients */}
              <Card className="overflow-hidden relative glass-card" data-testid="kpi-active-clients">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpiGradients[1]} pointer-events-none`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Clients
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpiIconColors[1]}`}>
                    <Users className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold tabular-nums" data-testid="value-active-clients">
                    {data?.clientCounts.active ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data?.clientCounts.total ?? 0} total clients
                  </p>
                </CardContent>
              </Card>

              {/* Pipeline Value */}
              <Card className="overflow-hidden relative glass-card" data-testid="kpi-pipeline-value">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpiGradients[2]} pointer-events-none`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pipeline Value
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpiIconColors[2]}`}>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-2xl font-bold tabular-nums" data-testid="value-pipeline">
                    {formatAUD(data?.pipelineValue ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">open proposals</p>
                </CardContent>
              </Card>

              {/* Task Completion */}
              <Card className="overflow-hidden relative glass-card" data-testid="kpi-task-completion">
                <div className={`absolute inset-0 bg-gradient-to-br ${kpiGradients[3]} pointer-events-none`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Task Completion
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpiIconColors[3]}`}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center gap-3">
                    <ProgressRing
                      value={taskComplete}
                      max={taskTotal}
                      size={48}
                      strokeWidth={5}
                      color="#10b981"
                    >
                      <span className="text-xs font-bold tabular-nums">{taskPct}%</span>
                    </ProgressRing>
                    <div>
                      <div className="text-2xl font-bold tabular-nums" data-testid="value-task-pct">
                        {taskComplete}/{taskTotal}
                      </div>
                      <p className="text-xs text-muted-foreground">tasks done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Focus areas
            </p>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Revenue, clients, and task momentum
            </h3>
          </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Revenue Goal Tracker */}
          <Card data-testid="card-revenue-goal" className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-orange-500/12">
                    <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  Revenue Goal
                </CardTitle>
                <div className="flex gap-1">
                  {monthlyGoal && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={() => { setEditingGoal(monthlyGoal); setGoalDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg"
                    onClick={() => { setEditingGoal(null); setGoalDialogOpen(true); }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Skeleton className="h-[120px] w-[120px] rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ProgressRing
                    value={data?.totalMRR ?? 0}
                    max={goalTarget}
                    size={120}
                    strokeWidth={10}
                    color={
                      goalPct >= 100
                        ? "#10b981"
                        : goalPct >= 70
                        ? "#0ea5e9"
                        : "#f59e0b"
                    }
                  >
                    <span className="text-lg font-bold tabular-nums" data-testid="value-goal-pct">
                      {goalPct}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">of goal</span>
                  </ProgressRing>

                  <div className="text-center space-y-0.5">
                    <p className="text-sm tabular-nums font-medium" data-testid="value-goal-current">
                      {formatAUD(data?.totalMRR ?? 0)}{" "}
                      <span className="text-muted-foreground font-normal">
                        / {formatAUD(goalTarget)}
                      </span>
                    </p>
                    {monthlyGoal?.period && (
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const d = parse(monthlyGoal.period, "yyyy-MM", new Date());
                            return format(d, "MMMM yyyy");
                          } catch { return monthlyGoal.period; }
                        })()} target
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Status Breakdown */}
          <Card data-testid="card-client-status" className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-violet-500/10">
                  <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                Client Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-[80px] h-[80px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={clientPieData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={24}
                            outerRadius={38}
                            strokeWidth={0}
                          >
                            {clientPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {(
                        [
                          { key: "active", label: "Active", icon: <CheckCircle2 className="h-3 w-3" />, color: "bg-emerald-500" },
                          { key: "onboarding", label: "Onboarding", icon: <UserPlus className="h-3 w-3" />, color: "bg-sky-500" },
                          { key: "paused", label: "Paused", icon: <Pause className="h-3 w-3" />, color: "bg-amber-500" },
                          { key: "churned", label: "Churned", icon: <UserMinus className="h-3 w-3" />, color: "bg-rose-500" },
                        ] as const
                      ).map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between"
                          data-testid={`client-status-${item.key}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {item.icon}
                              {item.label}
                            </span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {data?.clientCounts[item.key] ?? 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Horizontal stacked bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex" data-testid="client-status-bar">
                    {(["active", "onboarding", "paused", "churned"] as const).map((status) => {
                      const count = data?.clientCounts[status] ?? 0;
                      const total = data?.clientCounts.total ?? 1;
                      const pct = (count / total) * 100;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={status}
                          className={`${statusBarColor[status]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Stats */}
          <Card data-testid="card-task-stats" className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-500/10">
                  <ListTodo className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                Task Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 p-3.5 space-y-1"
                    data-testid="task-stat-todo"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ListTodo className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">To Do</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">
                      {data?.taskCompletionStats.todo ?? 0}
                    </p>
                  </div>

                  <div
                    className="rounded-xl bg-gradient-to-br from-sky-500/8 to-sky-500/3 p-3.5 space-y-1"
                    data-testid="task-stat-in-progress"
                  >
                    <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">In Progress</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">
                      {data?.taskCompletionStats.in_progress ?? 0}
                    </p>
                  </div>

                  <div
                    className="rounded-xl bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 p-3.5 space-y-1"
                    data-testid="task-stat-complete"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Complete</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">
                      {data?.taskCompletionStats.complete ?? 0}
                    </p>
                  </div>

                  <div
                    className="rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 p-3.5 space-y-1"
                    data-testid="task-stat-total"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Total</span>
                    </div>
                    <p className="text-xl font-bold tabular-nums">
                      {data?.taskCompletionStats.total ?? 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Detail
            </p>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Client value and recent activity
            </h3>
          </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Top Clients by MRR */}
          <Card className="lg:col-span-3 glass-card" data-testid="card-top-clients">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-500/12">
                  <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                Top Clients by MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton />
              ) : (data?.topClientsByMRR?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No active clients yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Business</TableHead>
                      <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">MRR</TableHead>
                      <TableHead className="h-9 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.topClientsByMRR.slice(0, 5).map((client, idx) => (
                      <TableRow key={client.id} className="hover:bg-muted/50" data-testid={`top-client-row-${idx}`}>
                        <TableCell className="py-3 font-medium text-sm">
                          {client.businessName}
                        </TableCell>
                        <TableCell className="py-3 text-right tabular-nums text-sm font-semibold">
                          {formatAUD(client.mrr ?? 0)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Badge
                            className={`text-[11px] px-2.5 py-0.5 font-medium rounded-full ${
                              statusColor[client.status] ?? ""
                            }`}
                            variant="outline"
                            data-testid={`badge-status-${client.id}`}
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="lg:col-span-2 glass-card" data-testid="card-recent-activity">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-violet-500/10">
                  <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <ActivitySkeleton />
              ) : (data?.recentActivity?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {data?.recentActivity.slice(0, 10).map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 group"
                      data-testid={`activity-item-${idx}`}
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/60 text-muted-foreground group-hover:from-primary/10 group-hover:to-primary/5 group-hover:text-primary transition-colors">
                        {getActivityIcon(item.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug text-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                          {item.createdAt
                            ? formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                              })
                            : "just now"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </section>
      </div>

      <RevenueGoalDialog
        open={goalDialogOpen}
        onOpenChange={(v) => { setGoalDialogOpen(v); if (!v) setEditingGoal(null); }}
        editingGoal={editingGoal}
      />
    </div>
  );
}
