import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Users,
  Eye,
  TrendingUp,
  Target,
  Calendar,
  FileText,
  CheckCircle2,
  Download,
  Clock,
  AlertTriangle,
  Zap,
  MessageSquare,
  SendHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────
interface ShareData {
  type: "analytics" | "calendar" | "contract" | "plan";
  data: any;
  expired?: boolean;
  clientName?: string;
}

// ── TLM Branding Header ──────────────────────────────
function TLMHeader({ clientName }: { clientName?: string }) {
  return (
    <header
      className="bg-white border-b px-6 py-4 flex items-center justify-between"
      data-testid="tlm-header"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center"
          data-testid="tlm-logo"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-white"
            aria-label="TLM"
          >
            <path
              d="M4 6h16M4 6v12l8-6 8 6V6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900" data-testid="text-brand-name">
            TLM Agency Engine
          </h1>
          {clientName && (
            <p className="text-xs text-gray-500" data-testid="text-client-name">
              {clientName}
            </p>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="text-xs" data-testid="badge-shared-view">
        Shared View
      </Badge>
    </header>
  );
}

// ── Expired Link View ────────────────────────────────
function ExpiredView() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TLMHeader />
      <div className="flex-1 flex items-center justify-center p-6" data-testid="view-expired">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-expired-title">
              Link Expired
            </h2>
            <p className="text-sm text-gray-500" data-testid="text-expired-desc">
              This shared link has expired. Please contact your account manager for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Loading View ──────────────────────────────────────
function LoadingView() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="view-loading">
      <div className="bg-white border-b px-6 py-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ── Public Analytics Dashboard ────────────────────────
function PublicAnalytics({ data, clientName }: { data: any; clientName?: string }) {
  const [platform, setPlatform] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  const analytics = data?.analytics || [];
  const summary = data?.summary || {};

  // Filter analytics by platform
  const filtered = useMemo(() => {
    let items = analytics;
    if (platform !== "all") {
      items = items.filter((a: any) => a.platform === platform);
    }
    return items;
  }, [analytics, platform]);

  // Aggregate chart data by date
  const chartData = useMemo(() => {
    const byDate: Record<string, { date: string; followers: number; impressions: number }> = {};
    filtered.forEach((a: any) => {
      if (!byDate[a.date]) {
        byDate[a.date] = { date: a.date, followers: 0, impressions: 0 };
      }
      byDate[a.date].followers += a.followers || 0;
      byDate[a.date].impressions += a.impressions || 0;
    });
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const kpis = [
    {
      label: "Followers",
      value: formatNumber(summary.totalFollowers || 0),
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Impressions",
      value: formatNumber(summary.totalImpressions || 0),
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Engagement",
      value: `${(summary.avgEngagement || 0).toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Reach",
      value: formatNumber(summary.totalReach || 0),
      icon: Target,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="view-analytics">
      <TLMHeader clientName={clientName} />
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-lg font-semibold text-gray-900" data-testid="text-analytics-title">
            Analytics Dashboard
          </h2>
          <div className="flex items-center gap-3">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-36 bg-white" data-testid="select-platform-filter">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-platform-all">All Platforms</SelectItem>
                <SelectItem value="instagram" data-testid="option-platform-instagram">Instagram</SelectItem>
                <SelectItem value="tiktok" data-testid="option-platform-tiktok">TikTok</SelectItem>
                <SelectItem value="facebook" data-testid="option-platform-facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 bg-white" data-testid="select-date-range">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7" data-testid="option-range-7">7 days</SelectItem>
                <SelectItem value="14" data-testid="option-range-14">14 days</SelectItem>
                <SelectItem value="30" data-testid="option-range-30">30 days</SelectItem>
                <SelectItem value="90" data-testid="option-range-90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="bg-white" data-testid={`kpi-${label.toLowerCase()}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-lg font-semibold text-gray-900" data-testid={`text-kpi-value-${label.toLowerCase()}`}>
                      {value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Follower Growth Chart */}
        <Card className="bg-white mb-6" data-testid="chart-followers">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Follower Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(246, 75%, 59%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(246, 75%, 59%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke="hsl(246, 75%, 59%)"
                    fill="url(#followerGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Impressions Chart */}
        <Card className="bg-white" data-testid="chart-impressions">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="impressionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="hsl(199, 89%, 48%)"
                    fill="url(#impressionGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </main>
      <PortalFooter />
    </div>
  );
}

// ── Public Content Calendar ───────────────────────────
function PublicCalendar({ data, clientName }: { data: any; clientName?: string }) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const contentPieces = data?.contentPieces || [];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{ day: number | null; pieces: any[] }> = [];
    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, pieces: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const pieces = contentPieces.filter((p: any) => p.scheduledDate === dateStr);
      days.push({ day: d, pieces });
    }
    return days;
  }, [contentPieces, year, month, firstDay, daysInMonth]);

  const contentTypeColors: Record<string, string> = {
    video: "bg-red-100 text-red-700",
    image: "bg-blue-100 text-blue-700",
    carousel: "bg-purple-100 text-purple-700",
    story: "bg-pink-100 text-pink-700",
    reel: "bg-orange-100 text-orange-700",
    ugc: "bg-green-100 text-green-700",
    text_post: "bg-gray-100 text-gray-700",
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="view-calendar">
      <TLMHeader clientName={clientName} />
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900" data-testid="text-calendar-title">
            Content Calendar
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth} data-testid="button-prev-month">
              Prev
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center" data-testid="text-current-month">
              {monthLabel}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth} data-testid="button-next-month">
              Next
            </Button>
          </div>
        </div>

        {/* Content Type Legend */}
        <div className="flex flex-wrap gap-2 mb-4" data-testid="calendar-legend">
          {Object.entries(contentTypeColors).map(([type, cls]) => (
            <Badge key={type} className={`${cls} text-xs font-normal`} data-testid={`legend-${type}`}>
              {type.replace("_", " ")}
            </Badge>
          ))}
        </div>

        {/* Calendar Grid */}
        <Card className="bg-white overflow-hidden" data-testid="calendar-grid">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-gray-500 py-2 border-r last:border-r-0"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((cell, index) => (
                <div
                  key={index}
                  className={`min-h-[80px] sm:min-h-[100px] border-r border-b last:border-r-0 p-1 ${
                    cell.day === null ? "bg-gray-50" : "bg-white"
                  }`}
                  data-testid={cell.day ? `calendar-day-${cell.day}` : `calendar-empty-${index}`}
                >
                  {cell.day !== null && (
                    <>
                      <span className="text-xs font-medium text-gray-600">{cell.day}</span>
                      <div className="mt-1 space-y-0.5">
                        {cell.pieces.slice(0, 3).map((piece: any, i: number) => (
                          <div
                            key={i}
                            className={`text-[10px] px-1 py-0.5 rounded truncate ${
                              contentTypeColors[piece.type] || "bg-gray-100 text-gray-700"
                            }`}
                            title={piece.title}
                            data-testid={`content-piece-${cell.day}-${i}`}
                          >
                            {piece.title}
                          </div>
                        ))}
                        {cell.pieces.length > 3 && (
                          <span className="text-[10px] text-gray-400">
                            +{cell.pieces.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <PortalFooter />
    </div>
  );
}

// ── Public Contract Signing ───────────────────────────
function PublicContract({ data, clientName, token }: { data: any; clientName?: string; token: string }) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [signed, setSigned] = useState(data?.status === "signed" || !!data?.clientSignature);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [stripeRedirectUrl, setStripeRedirectUrl] = useState<string | null>(null);

  const contract = data || {};

  // Canvas drawing handlers
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCanvasCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setHasDrawn(true);
    },
    [getCanvasCoords]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCanvasCoords(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, getCanvasCoords]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const signMutation = useMutation({
    mutationFn: async () => {
      let signature = "";
      if (signatureMode === "type") {
        signature = typedName;
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
          signature = canvas.toDataURL("image/png");
        }
      }
      const res = await apiRequest("PATCH", `/api/share/${token}/sign`, {
        clientSignature: signature,
        signedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: (result: any) => {
      setSigned(true);
      toast({ title: "Contract signed successfully!" });

      // If both parties have now signed and Stripe checkout URL is returned, redirect
      if (result.stripeCheckoutUrl) {
        setStripeRedirectUrl(result.stripeCheckoutUrl);
        toast({
          title: "Redirecting to payment...",
          description: "Setting up your recurring payment via Stripe.",
        });
        // Auto-redirect after a brief delay
        setTimeout(() => {
          window.location.href = result.stripeCheckoutUrl;
        }, 2000);
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error signing", description: err.message, variant: "destructive" });
    },
  });

  const canSign =
    signatureMode === "type" ? typedName.trim().length > 0 : hasDrawn;

  // Signed state — show confirmation + Stripe redirect if applicable
  if (signed || contract.clientSignature) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="view-contract-signed">
        <TLMHeader clientName={clientName} />
        <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
          {/* Signatures Summary */}
          <Card className="bg-white mb-6" data-testid="card-signatures-summary">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900" data-testid="text-signed-title">
                    Contract Signed
                  </h2>
                  <p className="text-sm text-gray-500">
                    Thank you for signing this contract.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Party 1: Agency */}
                <div
                  className={`rounded-lg border p-4 ${
                    contract.agencySignature
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                  data-testid="portal-sig-agency"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {contract.agencySignature ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Party 1 — Agency</span>
                  </div>
                  {contract.agencySignature ? (
                    <p className="font-serif italic text-lg text-gray-800">{contract.agencySignature}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Awaiting agency signature</p>
                  )}
                </div>

                {/* Party 2: Client */}
                <div
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
                  data-testid="portal-sig-client"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Party 2 — Client</span>
                  </div>
                  {contract.clientSignature?.startsWith("data:") ? (
                    <img src={contract.clientSignature} alt="Signature" className="h-10 object-contain" />
                  ) : (
                    <p className="font-serif italic text-lg text-gray-800">
                      {contract.clientSignature || typedName || "Signed"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe redirect notice */}
          {stripeRedirectUrl && (
            <Card className="bg-white mb-6 border-indigo-200" data-testid="card-stripe-redirect">
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5 text-indigo-600 animate-pulse" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Setting Up Payment</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Redirecting you to Stripe to set up your recurring payment of ${(contract.monthlyValue || 0).toLocaleString()}/month...
                </p>
                <Button
                  onClick={() => { window.location.href = stripeRedirectUrl; }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  data-testid="button-go-to-stripe"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Go to Stripe Checkout
                </Button>
              </CardContent>
            </Card>
          )}

          {!stripeRedirectUrl && (
            <Card className="bg-white" data-testid="card-download">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-500 mb-3">
                  {contract.agencySignature && contract.clientSignature
                    ? "Both parties have signed. Your account manager will be in touch regarding payment setup."
                    : "Once both parties have signed, payment will be set up automatically."}
                </p>
                <Button variant="outline" data-testid="button-download-pdf">
                  <Download className="mr-2 h-4 w-4" />
                  Download Contract
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
        <PortalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-testid="view-contract">
      <TLMHeader clientName={clientName} />
      <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-gray-900 mb-4" data-testid="text-contract-title">
          Contract Agreement
        </h2>

        {/* Contract Details */}
        <Card className="bg-white mb-6" data-testid="card-contract-details">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Service Description</Label>
                <p className="text-sm font-medium text-gray-900 whitespace-pre-line" data-testid="text-service-desc">
                  {contract.serviceDescription || "—"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Monthly Value</Label>
                  <p className="text-sm font-medium text-gray-900" data-testid="text-monthly-value">
                    ${(contract.monthlyValue || 0).toLocaleString()} AUD
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">GST Handling</Label>
                  <p className="text-sm text-gray-900" data-testid="text-gst">
                    {contract.gstHandling === "inclusive" ? "GST Inclusive" : contract.gstHandling === "exclusive" ? "GST Exclusive" : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Start Date</Label>
                  <p className="text-sm text-gray-900" data-testid="text-start-date">
                    {contract.startDate || "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">End Date</Label>
                  <p className="text-sm text-gray-900" data-testid="text-end-date">
                    {contract.endDate || "Not specified"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-gray-500">Payment Terms</Label>
                  <p className="text-sm text-gray-900" data-testid="text-payment-terms">
                    {contract.paymentTerms || "—"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agency Signature Display (read-only) */}
        <Card className="bg-white mb-6" data-testid="card-agency-sig">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Party 1 — Agency Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.agencySignature ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-serif italic text-xl text-gray-800" data-testid="text-agency-sig">
                    {contract.agencySignature}
                  </p>
                  {contract.signedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">Signed on {contract.signedAt}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <p className="text-sm italic">Awaiting agency signature</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Signature Section */}
        <Card className="bg-white" data-testid="card-signature">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Party 2 — Your Signature</CardTitle>
            <CardDescription>Sign this contract by typing your name or drawing your signature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button
                variant={signatureMode === "type" ? "default" : "outline"}
                size="sm"
                onClick={() => setSignatureMode("type")}
                data-testid="button-sig-type"
              >
                Type Name
              </Button>
              <Button
                variant={signatureMode === "draw" ? "default" : "outline"}
                size="sm"
                onClick={() => setSignatureMode("draw")}
                data-testid="button-sig-draw"
              >
                Draw Signature
              </Button>
            </div>

            {signatureMode === "type" ? (
              <div className="space-y-2">
                <Input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your full name"
                  className="text-lg"
                  data-testid="input-typed-signature"
                />
                {typedName && (
                  <p
                    className="text-2xl italic text-gray-700 font-serif px-3 py-2 border-b-2 border-gray-300"
                    data-testid="text-signature-preview"
                  >
                    {typedName}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="border rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    data-testid="canvas-signature"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCanvas}
                  data-testid="button-clear-signature"
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-xs text-indigo-700">
                By signing, you agree to the terms outlined in this contract.
                {contract.agencySignature
                  ? " Once signed, you will be redirected to set up your recurring payment."
                  : " Payment setup will begin once both parties have signed."}
              </p>
            </div>

            <Button
              className="mt-4 w-full sm:w-auto"
              disabled={!canSign || signMutation.isPending}
              onClick={() => signMutation.mutate()}
              data-testid="button-sign-contract"
            >
              <FileText className="mr-2 h-4 w-4" />
              {signMutation.isPending ? "Signing..." : "Sign Contract"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <PortalFooter />
    </div>
  );
}

// ── Public Plan Approval ──────────────────────────────
function PublicPlan({ data, clientName, token }: { data: any; clientName?: string; token: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [approved, setApproved] = useState(data?.status === "approved");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const plan = data || {};
  const ideas = plan.ideas || [];

  const contentTypeColors: Record<string, string> = {
    video: "bg-red-100 text-red-700",
    image: "bg-blue-100 text-blue-700",
    carousel: "bg-purple-100 text-purple-700",
    story: "bg-pink-100 text-pink-700",
    reel: "bg-orange-100 text-orange-700",
    ugc: "bg-green-100 text-green-700",
    text_post: "bg-gray-100 text-gray-700",
  };

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/share/${token}/approve`, {
        authorName: reviewerName || undefined,
        authorEmail: reviewerEmail || undefined,
        message: feedbackMessage || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      setApproved(true);
      setFeedbackMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/share-feedback", token] });
      toast({ title: "Plan approved!" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/share/${token}/request-changes`, {
        authorName: reviewerName || undefined,
        authorEmail: reviewerEmail || undefined,
        message: feedbackMessage || "Please revise this plan.",
      });
      return res.json();
    },
    onSuccess: () => {
      setApproved(false);
      setFeedbackMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/share-feedback", token] });
      toast({ title: "Revision request sent" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/share/${token}/feedback`, {
        kind: "comment",
        authorName: reviewerName || undefined,
        authorEmail: reviewerEmail || undefined,
        message: feedbackMessage,
      });
      return res.json();
    },
    onSuccess: () => {
      setFeedbackMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/share-feedback", token] });
      toast({ title: "Feedback sent" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const { data: feedbackEntries } = useQuery<any[]>({
    queryKey: ["/api/share-feedback", token],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/share/${token}/feedback`);
      return res.json();
    },
    enabled: !!token,
  });

  const reviewReady = reviewerName.trim().length > 0 || reviewerEmail.trim().length > 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f4f1ff_100%)] flex flex-col" data-testid="view-plan">
      <TLMHeader clientName={clientName} />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <Card className="border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(108,99,255,0.08)] backdrop-blur-xl">
              <CardContent className="space-y-5 p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                      Client Review
                    </p>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900" data-testid="text-plan-title">
                      {plan.title || "Content Plan"}
                    </h2>
                    {plan.description && (
                      <p className="max-w-2xl text-sm leading-6 text-gray-500" data-testid="text-plan-description">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  {approved ? (
                    <Badge className="bg-emerald-100 text-emerald-700 shrink-0" data-testid="badge-approved">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0" data-testid="badge-pending">
                      <Clock className="mr-1 h-3 w-3" />
                      In Review
                    </Badge>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Ideas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{ideas.length}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Client
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">{clientName || "Shared plan"}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Status
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {approved ? "Approved" : "Awaiting review"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3" data-testid="plan-ideas-list">
              {ideas.length === 0 ? (
                <Card className="bg-white/85">
                  <CardContent className="py-8 text-center text-sm text-gray-500" data-testid="text-no-ideas">
                    No content ideas in this plan yet.
                  </CardContent>
                </Card>
              ) : (
                ideas.map((idea: any, index: number) => (
                  <Card key={index} className="border-white/60 bg-white/88 shadow-[0_12px_36px_rgba(15,23,42,0.05)]" data-testid={`idea-card-${index}`}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge
                              className={`text-[10px] font-normal ${
                                contentTypeColors[idea.type] || "bg-gray-100 text-gray-700"
                              }`}
                              data-testid={`badge-idea-type-${index}`}
                            >
                              {idea.type?.replace("_", " ") || "content"}
                            </Badge>
                            {idea.platform && (
                              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-[0.16em]">
                                {idea.platform}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-semibold text-gray-900" data-testid={`text-idea-title-${index}`}>
                            {idea.title}
                          </h4>
                          {idea.concept && (
                            <p className="mt-2 text-sm leading-6 text-gray-500" data-testid={`text-idea-concept-${index}`}>
                              {idea.concept}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-white/60 bg-white/88 shadow-[0_18px_48px_rgba(79,70,229,0.08)]">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Leave Feedback</CardTitle>
                <CardDescription>
                  Add comments, approve the plan, or request changes in one place.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reviewer-name">Name</Label>
                    <Input
                      id="reviewer-name"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reviewer-email">Email</Label>
                    <Input
                      id="reviewer-email"
                      type="email"
                      value={reviewerEmail}
                      onChange={(e) => setReviewerEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="review-feedback">Feedback</Label>
                    <Textarea
                      id="review-feedback"
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                      placeholder="Share edits, notes, or approval context..."
                      rows={5}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    disabled={!reviewReady || approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                    data-testid="button-approve-plan"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {approveMutation.isPending ? "Approving..." : "Approve Plan"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!feedbackMessage.trim() || requestChangesMutation.isPending}
                    onClick={() => requestChangesMutation.mutate()}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {requestChangesMutation.isPending ? "Sending..." : "Request Changes"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!feedbackMessage.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate()}
                  >
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    {commentMutation.isPending ? "Sending..." : "Send Comment Only"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/60 bg-white/88">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                  <MessageSquare className="h-4 w-4" />
                  Review History
                </CardTitle>
                <CardDescription>
                  All client-side review activity for this shared plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {feedbackEntries?.length ? (
                  feedbackEntries.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full capitalize">
                            {entry.kind.replace("_", " ")}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {entry.authorName || "Client reviewer"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                        </span>
                      </div>
                      {entry.authorEmail && (
                        <p className="mt-2 text-xs text-gray-400">{entry.authorEmail}</p>
                      )}
                      {entry.message && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">{entry.message}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No feedback has been left yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}

// ── Footer ────────────────────────────────────────────
function PortalFooter() {
  return (
    <footer className="border-t bg-white px-6 py-4 text-center" data-testid="portal-footer">
      <p className="text-xs text-gray-400">
        Powered by TLM Agency Engine
      </p>
    </footer>
  );
}

// ── Helpers ───────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Main Public Portal Page ───────────────────────────
export default function PublicPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const { data, isLoading, isError } = useQuery<ShareData>({
    queryKey: ["/api/share", token],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/share/${token}`);
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return <LoadingView />;
  }

  if (isError || !data) {
    return <ExpiredView />;
  }

  if (data.expired) {
    return <ExpiredView />;
  }

  const clientName = data.clientName;

  switch (data.type) {
    case "analytics":
      return <PublicAnalytics data={data.data} clientName={clientName} />;
    case "calendar":
      return <PublicCalendar data={data.data} clientName={clientName} />;
    case "contract":
      return <PublicContract data={data.data} clientName={clientName} token={token} />;
    case "plan":
      return <PublicPlan data={data.data} clientName={clientName} token={token} />;
    default:
      return <ExpiredView />;
  }
}
