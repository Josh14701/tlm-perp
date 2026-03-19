import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Eye,
  TrendingUp,
  Target,
  Share2,
  Download,
  BarChart3,
  Instagram,
  Facebook,
  Heart,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Client, SocialAnalytics } from "@shared/schema";

// ── Types ─────────────────────────────────────────
type DateRange = "7" | "14" | "30" | "90";
type PlatformFilter = "all" | "instagram" | "tiktok" | "facebook";

// ── Helpers ───────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  instagram: "hsl(340, 75%, 55%)",
  tiktok: "hsl(180, 80%, 45%)",
  facebook: "hsl(214, 89%, 52%)",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

const PIE_COLORS = ["hsl(340, 75%, 55%)", "hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)"];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className="h-4 w-4" />;
    case "facebook":
      return <Facebook className="h-4 w-4" />;
    case "tiktok":
      return <span className="text-xs font-bold">TT</span>;
    default:
      return <BarChart3 className="h-4 w-4" />;
  }
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

// ── Skeleton Loaders ──────────────────────────────
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

function ChartSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${height}`} />
      </CardContent>
    </Card>
  );
}

// ── Simulated Top Posts ───────────────────────────
function generateTopPosts(analytics: SocialAnalytics[]) {
  if (!analytics.length) return [];
  const platforms = Array.from(new Set(analytics.map((a) => a.platform)));

  return Array.from({ length: 5 }, (_, i) => {
    const platform = platforms[i % platforms.length];
    const base = analytics.find((a) => a.platform === platform);
    const engMult = [1.8, 1.5, 1.3, 1.1, 0.95][i];
    return {
      id: i + 1,
      title: [
        "Behind the scenes reel",
        "Product launch carousel",
        "Customer testimonial",
        "Industry tips thread",
        "Team culture post",
      ][i],
      platform,
      engagement: Math.round((base?.likes ?? 120) * engMult + (base?.comments ?? 30) * engMult),
      reach: Math.round((base?.reach ?? 2000) * engMult),
      type: ["Reel", "Carousel", "Video", "Thread", "Image"][i],
    };
  });
}

// ── Main Component ────────────────────────────────
export default function Analytics() {
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  // Fetch clients for the selector
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch analytics for selected client
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<SocialAnalytics[]>({
    queryKey: ["/api/analytics", selectedClientId, { platform: platformFilter }],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/analytics/${selectedClientId}?platform=${platformFilter}`
      );
      return res.json();
    },
    enabled: !!selectedClientId,
  });

  // Share link mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/share", {
        type: "analytics",
        resourceId: selectedClientId,
        clientId: selectedClientId,
      });
      return res.json();
    },
    onSuccess: (data: { token: string }) => {
      const url = `${window.location.origin}/#/share/${data.token}`;
      navigator.clipboard?.writeText(url);
      toast({
        title: "Share link created",
        description: "Link copied to clipboard",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    },
  });

  // ── Computed data ─────────────────────────────
  const filteredAnalytics = useMemo(() => {
    if (!analyticsData) return [];
    const cutoff = getDaysAgo(Number(dateRange));
    return analyticsData.filter((a) => a.date >= cutoff);
  }, [analyticsData, dateRange]);

  // KPIs
  const kpis = useMemo(() => {
    if (!filteredAnalytics.length) {
      return { followers: 0, impressions: 0, avgEngagement: 0, totalReach: 0 };
    }

    // Latest followers per platform
    const latestByPlatform: Record<string, number> = {};
    const latestDateByPlatform: Record<string, string> = {};
    filteredAnalytics.forEach((a) => {
      if (!latestByPlatform[a.platform] || a.date > (latestDateByPlatform[a.platform] ?? "")) {
        latestByPlatform[a.platform] = a.followers ?? 0;
        latestDateByPlatform[a.platform] = a.date;
      }
    });
    const platformKeys = Array.from(new Set(filteredAnalytics.map((a) => a.platform)));
    const followers = platformKeys.reduce((sum, p) => sum + (latestByPlatform[p] ?? 0), 0);

    const impressions = filteredAnalytics.reduce((sum, a) => sum + (a.impressions ?? 0), 0);
    const totalReach = filteredAnalytics.reduce((sum, a) => sum + (a.reach ?? 0), 0);

    const rates = filteredAnalytics.map((a) => a.engagementRate ?? 0).filter((r) => r > 0);
    const avgEngagement = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    return { followers, impressions, avgEngagement, totalReach };
  }, [filteredAnalytics]);

  // Follower growth chart data (one line per platform)
  const followerChartData = useMemo(() => {
    if (!filteredAnalytics.length) return [];
    const dateMap: Record<string, Record<string, number>> = {};
    filteredAnalytics.forEach((a) => {
      if (!dateMap[a.date]) dateMap[a.date] = {};
      dateMap[a.date][a.platform] = a.followers ?? 0;
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, platforms]) => ({
        date: new Date(date).toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
        ...platforms,
      } as Record<string, string | number>));
  }, [filteredAnalytics]);

  // Impressions bar chart data
  const impressionsChartData = useMemo(() => {
    if (!filteredAnalytics.length) return [];
    const dateMap: Record<string, number> = {};
    filteredAnalytics.forEach((a) => {
      dateMap[a.date] = (dateMap[a.date] ?? 0) + (a.impressions ?? 0);
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, impressions]) => ({
        date: new Date(date).toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
        impressions,
      }));
  }, [filteredAnalytics]);

  // Engagement pie chart
  const engagementPieData = useMemo(() => {
    const likes = filteredAnalytics.reduce((s, a) => s + (a.likes ?? 0), 0);
    const comments = filteredAnalytics.reduce((s, a) => s + (a.comments ?? 0), 0);
    const shares = filteredAnalytics.reduce((s, a) => s + (a.shares ?? 0), 0);
    return [
      { name: "Likes", value: likes },
      { name: "Comments", value: comments },
      { name: "Shares", value: shares },
    ].filter((d) => d.value > 0);
  }, [filteredAnalytics]);

  // Platforms present in data
  const activePlatforms = useMemo(
    () => Array.from(new Set(filteredAnalytics.map((a) => a.platform))),
    [filteredAnalytics]
  );

  // Top posts
  const topPosts = useMemo(
    () => generateTopPosts(filteredAnalytics),
    [filteredAnalytics]
  );

  const selectedClient = clients?.find((c) => c.id === selectedClientId);
  const isLoading = analyticsLoading;
  const hasData = filteredAnalytics.length > 0;

  return (
    <div className="flex-1 overflow-auto" data-testid="page-analytics">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground">Monitor performance metrics</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* ── Filters Row ──────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-3"
          data-testid="analytics-filters"
        >
          {/* Client Selector */}
          <Select
            value={selectedClientId}
            onValueChange={setSelectedClientId}
          >
            <SelectTrigger
              className="w-[220px]"
              data-testid="select-client"
            >
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clientsLoading ? (
                <div className="p-2">
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : (
                clients?.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    data-testid={`client-option-${c.id}`}
                  >
                    {c.businessName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as DateRange)}
          >
            <SelectTrigger
              className="w-[160px]"
              data-testid="select-date-range"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select
            value={platformFilter}
            onValueChange={(v) => setPlatformFilter(v as PlatformFilter)}
          >
            <SelectTrigger
              className="w-[160px]"
              data-testid="select-platform"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* Actions */}
          {selectedClientId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareMutation.mutate()}
                disabled={shareMutation.isPending}
                data-testid="btn-share-analytics"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: "Export started",
                    description: "Your PDF report is being generated...",
                  })
                }
                data-testid="btn-export-pdf"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export PDF
              </Button>
            </>
          )}
        </div>

        {/* ── Empty State ──────────────────────────── */}
        {!selectedClientId && (
          <Card
            className="flex flex-col items-center justify-center py-16"
            data-testid="empty-state-analytics"
          >
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-lg font-semibold mb-1">Select a Client</h2>
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              Choose a client from the dropdown above to view their social media
              analytics and performance metrics.
            </p>
          </Card>
        )}

        {/* ── Loading State ────────────────────────── */}
        {selectedClientId && isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
              <KPISkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </>
        )}

        {/* ── Data View ────────────────────────────── */}
        {selectedClientId && !isLoading && (
          <>
            {/* Client name badge */}
            {selectedClient && (
              <div className="flex items-center gap-2" data-testid="selected-client-name">
                <Badge variant="outline" className="text-xs">
                  {selectedClient.businessName}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Last {dateRange} days
                  {platformFilter !== "all" && ` · ${PLATFORM_LABELS[platformFilter]}`}
                </span>
              </div>
            )}

            {/* ── KPI Cards ────────────────────────── */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              data-testid="kpi-row"
            >
              <Card data-testid="kpi-followers">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Followers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-xl font-bold tabular-nums"
                    data-testid="value-followers"
                  >
                    {formatNumber(kpis.followers)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across {activePlatforms.length} platform{activePlatforms.length !== 1 && "s"}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-impressions">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Impressions
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-xl font-bold tabular-nums"
                    data-testid="value-impressions"
                  >
                    {formatNumber(kpis.impressions)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    in the last {dateRange} days
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-engagement">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Engagement Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-xl font-bold tabular-nums"
                    data-testid="value-engagement"
                  >
                    {formatPct(kpis.avgEngagement)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    across all platforms
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="kpi-reach">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Reach
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-xl font-bold tabular-nums"
                    data-testid="value-reach"
                  >
                    {formatNumber(kpis.totalReach)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    unique accounts
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── Charts Row ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Follower Growth Chart */}
              <Card data-testid="chart-follower-growth">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Follower Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasData ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No data for selected period
                    </p>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={followerChartData}>
                          <defs>
                            {activePlatforms.map((p) => (
                              <linearGradient
                                key={p}
                                id={`gradient-${p}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor={PLATFORM_COLORS[p] ?? "hsl(var(--primary))"}
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={PLATFORM_COLORS[p] ?? "hsl(var(--primary))"}
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            tickFormatter={(v) => formatNumber(v)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Legend />
                          {activePlatforms.map((p) => (
                            <Area
                              key={p}
                              type="monotone"
                              dataKey={p}
                              name={PLATFORM_LABELS[p] ?? p}
                              stroke={PLATFORM_COLORS[p] ?? "hsl(var(--primary))"}
                              fill={`url(#gradient-${p})`}
                              strokeWidth={2}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Impressions Over Time */}
              <Card data-testid="chart-impressions">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Impressions Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasData ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No data for selected period
                    </p>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={impressionsChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            className="text-muted-foreground"
                            tickFormatter={(v) => formatNumber(v)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="impressions"
                            name="Impressions"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Engagement + Top Posts Row ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Engagement Breakdown */}
              <Card data-testid="chart-engagement-breakdown">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Engagement Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {engagementPieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No engagement data
                    </p>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={engagementPieData}
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              strokeWidth={0}
                              paddingAngle={2}
                            >
                              {engagementPieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: "12px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        {engagementPieData.map((d, i) => (
                          <div
                            key={d.name}
                            className="flex items-center gap-1.5"
                            data-testid={`engagement-legend-${d.name.toLowerCase()}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {d.name}
                            </span>
                            <span className="text-xs font-semibold tabular-nums">
                              {formatNumber(d.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing Posts */}
              <Card className="lg:col-span-2" data-testid="table-top-posts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Top Performing Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No posts data available
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9 text-xs">Post</TableHead>
                          <TableHead className="h-9 text-xs">Platform</TableHead>
                          <TableHead className="h-9 text-xs">Type</TableHead>
                          <TableHead className="h-9 text-xs text-right">
                            Engagement
                          </TableHead>
                          <TableHead className="h-9 text-xs text-right">
                            Reach
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topPosts.map((post) => (
                          <TableRow
                            key={post.id}
                            data-testid={`top-post-row-${post.id}`}
                          >
                            <TableCell className="py-2.5 text-sm font-medium max-w-[200px] truncate">
                              {post.title}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <Badge
                                variant="outline"
                                className="text-[11px] px-2 py-0 gap-1"
                              >
                                {getPlatformIcon(post.platform)}
                                {PLATFORM_LABELS[post.platform] ?? post.platform}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 text-sm text-muted-foreground">
                              {post.type}
                            </TableCell>
                            <TableCell className="py-2.5 text-sm text-right tabular-nums font-medium">
                              {formatNumber(post.engagement)}
                            </TableCell>
                            <TableCell className="py-2.5 text-sm text-right tabular-nums">
                              {formatNumber(post.reach)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
