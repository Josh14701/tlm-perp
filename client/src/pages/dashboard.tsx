import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parse, format } from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
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
  onboarding: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  churned: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20",
};

const statusBarColor: Record<string, string> = {
  active: "bg-emerald-500",
  onboarding: "bg-blue-500",
  paused: "bg-amber-500",
  churned: "bg-red-500",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-28 mb-1" />
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
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────
export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  const taskTotal = data?.taskCompletionStats.total ?? 0;
  const taskComplete = data?.taskCompletionStats.complete ?? 0;
  const taskPct = taskTotal > 0 ? Math.round((taskComplete / taskTotal) * 100) : 0;

  // Find the monthly revenue goal (most recent)
  const monthlyGoal = data?.revenueGoals?.find((g) => g.type === "monthly");
  const goalTarget = monthlyGoal?.target ?? 0;
  const goalPct = goalTarget > 0 ? Math.round(((data?.totalMRR ?? 0) / goalTarget) * 100) : 0;

  // Client status pie data
  const clientPieData = data
    ? [
        { name: "Active", value: data.clientCounts.active, fill: "hsl(142, 71%, 45%)" },
        { name: "Onboarding", value: data.clientCounts.onboarding, fill: "hsl(199, 89%, 48%)" },
        { name: "Paused", value: data.clientCounts.paused, fill: "hsl(38, 92%, 50%)" },
        { name: "Churned", value: data.clientCounts.churned, fill: "hsl(0, 72%, 51%)" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="flex-1 overflow-auto" data-testid="page-dashboard">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <h1 className="text-lg font-semibold" data-testid="page-title">
          Dashboard
        </h1>
      </header>

      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* ── KPI Row ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-row">
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
              <Card data-testid="kpi-total-mrr">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total MRR
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums" data-testid="value-total-mrr">
                    {formatAUD(data?.totalMRR ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    from {data?.clientCounts.active ?? 0} active clients
                  </p>
                </CardContent>
              </Card>

              {/* Active Clients */}
              <Card data-testid="kpi-active-clients">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Clients
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums" data-testid="value-active-clients">
                    {data?.clientCounts.active ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data?.clientCounts.total ?? 0} total clients
                  </p>
                </CardContent>
              </Card>

              {/* Pipeline Value */}
              <Card data-testid="kpi-pipeline-value">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pipeline Value
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold tabular-nums" data-testid="value-pipeline">
                    {formatAUD(data?.pipelineValue ?? 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">open proposals</p>
                </CardContent>
              </Card>

              {/* Task Completion */}
              <Card data-testid="kpi-task-completion">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Task Completion
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <ProgressRing
                      value={taskComplete}
                      max={taskTotal}
                      size={48}
                      strokeWidth={5}
                      color="hsl(var(--chart-3))"
                    >
                      <span className="text-xs font-bold tabular-nums">{taskPct}%</span>
                    </ProgressRing>
                    <div>
                      <div className="text-xl font-bold tabular-nums" data-testid="value-task-pct">
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

        {/* ── Middle Row: Revenue Goal + Client Status + Task Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Goal Tracker */}
          <Card data-testid="card-revenue-goal">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Revenue Goal
              </CardTitle>
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
                        ? "hsl(142, 71%, 45%)"
                        : goalPct >= 70
                        ? "hsl(var(--chart-2))"
                        : "hsl(var(--chart-4))"
                    }
                  >
                    <span className="text-lg font-bold tabular-nums" data-testid="value-goal-pct">
                      {goalPct}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">of goal</span>
                  </ProgressRing>

                  <div className="text-center space-y-0.5">
                    <p className="text-sm tabular-nums" data-testid="value-goal-current">
                      {formatAUD(data?.totalMRR ?? 0)}{" "}
                      <span className="text-muted-foreground">
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
          <Card data-testid="card-client-status">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
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
                  {/* Mini pie chart */}
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
                    <div className="flex-1 space-y-2">
                      {(
                        [
                          { key: "active", label: "Active", icon: <CheckCircle2 className="h-3 w-3" /> },
                          { key: "onboarding", label: "Onboarding", icon: <UserPlus className="h-3 w-3" /> },
                          { key: "paused", label: "Paused", icon: <Pause className="h-3 w-3" /> },
                          { key: "churned", label: "Churned", icon: <UserMinus className="h-3 w-3" /> },
                        ] as const
                      ).map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between"
                          data-testid={`client-status-${item.key}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${statusBarColor[item.key]}`}
                            />
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
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex" data-testid="client-status-bar">
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
          <Card data-testid="card-task-stats">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                Task Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-lg bg-muted/50 p-3 space-y-1"
                    data-testid="task-stat-todo"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ListTodo className="h-3.5 w-3.5" />
                      <span className="text-xs">To Do</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">
                      {data?.taskCompletionStats.todo ?? 0}
                    </p>
                  </div>

                  <div
                    className="rounded-lg bg-muted/50 p-3 space-y-1"
                    data-testid="task-stat-in-progress"
                  >
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">In Progress</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">
                      {data?.taskCompletionStats.in_progress ?? 0}
                    </p>
                  </div>

                  <div
                    className="rounded-lg bg-muted/50 p-3 space-y-1"
                    data-testid="task-stat-complete"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-xs">Complete</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">
                      {data?.taskCompletionStats.complete ?? 0}
                    </p>
                  </div>

                  <div
                    className="rounded-lg bg-muted/50 p-3 space-y-1"
                    data-testid="task-stat-total"
                  >
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Activity className="h-3.5 w-3.5" />
                      <span className="text-xs">Total</span>
                    </div>
                    <p className="text-lg font-bold tabular-nums">
                      {data?.taskCompletionStats.total ?? 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row: Top Clients + Activity Feed ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Top Clients by MRR */}
          <Card className="lg:col-span-3" data-testid="card-top-clients">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
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
                    <TableRow>
                      <TableHead className="h-9 text-xs">Business</TableHead>
                      <TableHead className="h-9 text-xs text-right">MRR</TableHead>
                      <TableHead className="h-9 text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.topClientsByMRR.slice(0, 5).map((client, idx) => (
                      <TableRow key={client.id} data-testid={`top-client-row-${idx}`}>
                        <TableCell className="py-2.5 font-medium text-sm">
                          {client.businessName}
                        </TableCell>
                        <TableCell className="py-2.5 text-right tabular-nums text-sm">
                          {formatAUD(client.mrr ?? 0)}
                        </TableCell>
                        <TableCell className="py-2.5 text-right">
                          <Badge
                            className={`text-[11px] px-2 py-0 font-medium ${
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
          <Card className="lg:col-span-2" data-testid="card-recent-activity">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
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
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {data?.recentActivity.slice(0, 10).map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 group"
                      data-testid={`activity-item-${idx}`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
      </div>
    </div>
  );
}
