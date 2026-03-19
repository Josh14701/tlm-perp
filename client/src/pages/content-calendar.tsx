import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  ImageIcon,
  Layers,
  Clock,
  Film,
  Users,
  Type,
  Trash2,
  GripVertical,
  Lightbulb,
  PenLine,
  Clapperboard,
  Scissors,
  CheckCircle2,
  Radio,
  ArrowRight,
} from "lucide-react";
import {
  SiInstagram,
  SiTiktok,
  SiFacebook,
  SiYoutube,
} from "react-icons/si";
import { FaLinkedin, FaXTwitter } from "react-icons/fa6";
import type { ContentPiece, Client } from "@shared/schema";

// ── Constants ──────────────────────────────────────────

const CONTENT_TYPES = [
  "video",
  "image",
  "carousel",
  "story",
  "reel",
  "ugc",
  "text_post",
] as const;

const CONTENT_STATUSES = [
  "idea",
  "scripted",
  "filmed",
  "edited",
  "approved",
  "live",
] as const;

const PLATFORMS = [
  "Instagram",
  "TikTok",
  "LinkedIn",
  "Facebook",
  "YouTube",
  "Twitter",
] as const;

const TYPE_COLORS: Record<string, string> = {
  video: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25",
  image: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  carousel: "bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/25",
  story: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  reel: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  ugc: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  text_post: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/25",
};

const TYPE_DOT_COLORS: Record<string, string> = {
  video: "bg-purple-500",
  image: "bg-blue-500",
  carousel: "bg-pink-500",
  story: "bg-amber-500",
  reel: "bg-emerald-500",
  ugc: "bg-orange-500",
  text_post: "bg-gray-500",
};

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  scripted: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  filmed: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
  edited: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  live: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
};

const STATUS_PIPELINE_COLORS: Record<string, string> = {
  idea: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
  scripted: "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300",
  filmed: "bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300",
  edited: "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300",
  approved: "bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300",
  live: "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  idea: <Lightbulb className="h-3.5 w-3.5" />,
  scripted: <PenLine className="h-3.5 w-3.5" />,
  filmed: <Clapperboard className="h-3.5 w-3.5" />,
  edited: <Scissors className="h-3.5 w-3.5" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  live: <Radio className="h-3.5 w-3.5" />,
};

// ── Helpers ─────────────────────────────────────────

function typeLabel(type: string): string {
  if (type === "text_post") return "Text Post";
  if (type === "ugc") return "UGC";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function PlatformIcon({ platform, className = "h-3.5 w-3.5" }: { platform: string; className?: string }) {
  const p = platform.toLowerCase();
  if (p === "instagram") return <SiInstagram className={className} />;
  if (p === "tiktok") return <SiTiktok className={className} />;
  if (p === "linkedin") return <FaLinkedin className={className} />;
  if (p === "facebook") return <SiFacebook className={className} />;
  if (p === "youtube") return <SiYoutube className={className} />;
  if (p === "twitter") return <FaXTwitter className={className} />;
  return null;
}

function ContentTypeIcon({ type, className = "h-3.5 w-3.5" }: { type: string; className?: string }) {
  if (type === "video") return <Video className={className} />;
  if (type === "image") return <ImageIcon className={className} />;
  if (type === "carousel") return <Layers className={className} />;
  if (type === "story") return <Clock className={className} />;
  if (type === "reel") return <Film className={className} />;
  if (type === "ugc") return <Users className={className} />;
  if (type === "text_post") return <Type className={className} />;
  return null;
}

// ── Form Schema ─────────────────────────────────────

const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().default("idea"),
  script: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  platforms: z.array(z.string()).default([]),
  scheduledDate: z.string().optional(),
  assignedTo: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  planId: z.string().optional(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

// ── Content Dialog (Add/Edit) ────────────────────────

function ContentDialog({
  open,
  onOpenChange,
  editPiece,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPiece?: ContentPiece | null;
  defaultDate?: string;
}) {
  const { toast } = useToast();
  const { data: clients } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: editPiece?.title ?? "",
      type: editPiece?.type ?? "",
      status: editPiece?.status ?? "idea",
      script: editPiece?.script ?? "",
      caption: editPiece?.caption ?? "",
      hashtags: editPiece?.hashtags?.join(", ") ?? "",
      platforms: editPiece?.platforms ?? [],
      scheduledDate: editPiece?.scheduledDate ?? defaultDate ?? "",
      assignedTo: editPiece?.assignedTo ?? "",
      clientId: editPiece?.clientId ?? "",
      planId: editPiece?.planId ?? "",
    },
  });

  // Reset form when editPiece changes
  const formResetKey = editPiece?.id ?? "new";

  const createMutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
      const payload = {
        ...values,
        hashtags: values.hashtags
          ? values.hashtags.split(",").map((h) => h.trim()).filter(Boolean)
          : [],
        script: values.script || null,
        caption: values.caption || null,
        assignedTo: values.assignedTo || null,
        planId: values.planId || null,
        scheduledDate: values.scheduledDate || null,
      };
      const res = await apiRequest("POST", "/api/content-pieces", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      form.reset();
      onOpenChange(false);
      toast({ title: "Content created", description: "New content piece added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
      const payload = {
        ...values,
        hashtags: values.hashtags
          ? values.hashtags.split(",").map((h) => h.trim()).filter(Boolean)
          : [],
        script: values.script || null,
        caption: values.caption || null,
        assignedTo: values.assignedTo || null,
        planId: values.planId || null,
        scheduledDate: values.scheduledDate || null,
      };
      const res = await apiRequest("PATCH", `/api/content-pieces/${editPiece!.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      onOpenChange(false);
      toast({ title: "Content updated", description: "Content piece has been updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/content-pieces/${editPiece!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      onOpenChange(false);
      toast({ title: "Content deleted", description: "Content piece has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: ContentFormValues) {
    if (editPiece) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  function togglePlatform(platform: string) {
    const current = form.getValues("platforms");
    if (current.includes(platform)) {
      form.setValue("platforms", current.filter((p) => p !== platform));
    } else {
      form.setValue("platforms", [...current, platform]);
    }
  }

  const selectedPlatforms = form.watch("platforms");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={formResetKey}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-content-piece">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-content">
            {editPiece ? "Edit Content" : "Add Content"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-content-piece">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Behind the scenes reel" {...field} data-testid="input-content-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-content-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {typeLabel(t)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-content-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client & Scheduled Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-content-client">
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(clients ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value ?? ""} onChange={field.onChange} placeholder="Select date" data-testid="input-scheduled-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assigned To */}
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <FormControl>
                    <Input placeholder="Team member name" {...field} data-testid="input-assigned-to" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Platforms multi-select */}
            <div>
              <FormLabel className="text-sm font-medium mb-2 block">Platforms</FormLabel>
              <div className="flex flex-wrap gap-2" data-testid="platform-multi-select">
                {PLATFORMS.map((p) => {
                  const selected = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      }`}
                      data-testid={`platform-toggle-${p.toLowerCase()}`}
                    >
                      <PlatformIcon platform={p} className="h-3 w-3" />
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Script */}
            <FormField
              control={form.control}
              name="script"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Script</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Content script..." rows={3} {...field} data-testid="input-script" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Caption */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Post caption..." rows={2} {...field} data-testid="input-caption" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hashtags */}
            <FormField
              control={form.control}
              name="hashtags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hashtags</FormLabel>
                  <FormControl>
                    <Input placeholder="#marketing, #social, #content" {...field} data-testid="input-hashtags" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {editPiece && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-content"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-content"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-content">
                  {isPending ? "Saving..." : editPiece ? "Update" : "Add Content"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Status Pipeline ──────────────────────────────────

function StatusPipeline({ pieces }: { pieces: ContentPiece[] }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    CONTENT_STATUSES.forEach((s) => (c[s] = 0));
    pieces.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status]++;
    });
    return c;
  }, [pieces]);

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin"
      data-testid="status-pipeline"
    >
      {CONTENT_STATUSES.map((status, idx) => (
        <div key={status} className="flex items-center gap-1 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${STATUS_PIPELINE_COLORS[status]}`}
            data-testid={`pipeline-stage-${status}`}
          >
            {STATUS_ICONS[status]}
            <span className="capitalize">{status}</span>
            <span
              className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-black/10 dark:bg-white/10 px-1.5 text-[11px] font-bold tabular-nums"
              data-testid={`pipeline-count-${status}`}
            >
              {counts[status]}
            </span>
          </div>
          {idx < CONTENT_STATUSES.length - 1 && (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Month View ───────────────────────────────────────

function MonthView({
  currentDate,
  pieces,
  clientFilter,
  onChipClick,
  onDrop,
}: {
  currentDate: Date;
  pieces: ContentPiece[];
  clientFilter: string;
  onChipClick: (piece: ContentPiece) => void;
  onDrop: (pieceId: string, newDate: string) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filtered = useMemo(() => {
    return pieces.filter((p) => {
      if (clientFilter && clientFilter !== "all" && p.clientId !== clientFilter) return false;
      return true;
    });
  }, [pieces, clientFilter]);

  const piecesForDay = useCallback(
    (day: Date) => {
      return filtered.filter(
        (p) => p.scheduledDate && isSameDay(parseISO(p.scheduledDate), day)
      );
    },
    [filtered]
  );

  function handleDragStart(e: React.DragEvent, pieceId: string) {
    e.dataTransfer.setData("text/plain", pieceId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData("text/plain");
    if (pieceId) {
      onDrop(pieceId, format(day, "yyyy-MM-dd"));
    }
  }

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="border rounded-lg overflow-hidden" data-testid="month-view">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-xs font-medium text-muted-foreground text-center"
            data-testid={`weekday-header-${d}`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayPieces = piecesForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] md:min-h-[120px] border-b border-r p-1.5 transition-colors ${
                !inMonth ? "bg-muted/20" : "bg-background"
              } ${today ? "ring-1 ring-inset ring-primary/30" : ""}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              data-testid={`day-cell-${format(day, "yyyy-MM-dd")}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs tabular-nums font-medium leading-none ${
                    today
                      ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                      : !inMonth
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`day-number-${format(day, "yyyy-MM-dd")}`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayPieces.slice(0, 3).map((piece) => (
                  <div
                    key={piece.id}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] leading-tight cursor-pointer truncate border ${TYPE_COLORS[piece.type] ?? TYPE_COLORS.text_post} hover:opacity-80 transition-opacity`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, piece.id)}
                    onClick={() => onChipClick(piece)}
                    title={piece.title}
                    data-testid={`content-chip-${piece.id}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT_COLORS[piece.type] ?? "bg-gray-500"}`} />
                    <span className="truncate font-medium">{piece.title}</span>
                  </div>
                ))}
                {dayPieces.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1.5" data-testid={`more-count-${format(day, "yyyy-MM-dd")}`}>
                    +{dayPieces.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ────────────────────────────────────────

function WeekView({
  currentDate,
  pieces,
  clientFilter,
  onChipClick,
}: {
  currentDate: Date;
  pieces: ContentPiece[];
  clientFilter: string;
  onChipClick: (piece: ContentPiece) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filtered = useMemo(() => {
    return pieces.filter((p) => {
      if (clientFilter && clientFilter !== "all" && p.clientId !== clientFilter) return false;
      return true;
    });
  }, [pieces, clientFilter]);

  const piecesForDay = useCallback(
    (day: Date) => {
      return filtered.filter(
        (p) => p.scheduledDate && isSameDay(parseISO(p.scheduledDate), day)
      );
    },
    [filtered]
  );

  return (
    <div data-testid="week-view">
      {/* Desktop: 7-column grid */}
      <div className="hidden md:grid grid-cols-7 gap-3">
        {days.map((day) => {
          const dayPieces = piecesForDay(day);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`rounded-lg border p-3 min-h-[200px] ${
                today ? "ring-1 ring-primary/40 border-primary/30" : ""
              }`}
              data-testid={`week-day-${format(day, "yyyy-MM-dd")}`}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs text-muted-foreground font-medium">
                  {format(day, "EEE")}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    today
                      ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-2">
                {dayPieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="rounded-md border bg-card p-2 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => onChipClick(piece)}
                    data-testid={`week-content-card-${piece.id}`}
                  >
                    <p className="text-xs font-medium leading-tight truncate mb-1.5" data-testid={`week-content-title-${piece.id}`}>
                      {piece.title}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[piece.type] ?? ""}`}
                        data-testid={`week-content-type-${piece.id}`}
                      >
                        {typeLabel(piece.type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[piece.status] ?? ""}`}
                        data-testid={`week-content-status-${piece.id}`}
                      >
                        {statusLabel(piece.status)}
                      </Badge>
                    </div>
                    {piece.platforms && piece.platforms.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                        {piece.platforms.map((p) => (
                          <PlatformIcon key={p} platform={p} className="h-3 w-3" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {dayPieces.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-4">
                    No content
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked list */}
      <div className="md:hidden space-y-3">
        {days.map((day) => {
          const dayPieces = piecesForDay(day);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`rounded-lg border p-3 ${
                today ? "ring-1 ring-primary/40 border-primary/30" : ""
              }`}
              data-testid={`week-day-mobile-${format(day, "yyyy-MM-dd")}`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {format(day, "EEEE")}
                </span>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    today
                      ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      : ""
                  }`}
                >
                  {format(day, "d MMM")}
                </span>
              </div>
              <div className="space-y-2">
                {dayPieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="rounded-md border bg-card p-2 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => onChipClick(piece)}
                    data-testid={`week-content-card-mobile-${piece.id}`}
                  >
                    <p className="text-xs font-medium leading-tight truncate mb-1">
                      {piece.title}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[piece.type] ?? ""}`}
                      >
                        {typeLabel(piece.type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[piece.status] ?? ""}`}
                      >
                        {statusLabel(piece.status)}
                      </Badge>
                    </div>
                    {piece.platforms && piece.platforms.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                        {piece.platforms.map((p) => (
                          <PlatformIcon key={p} platform={p} className="h-3 w-3" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {dayPieces.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-2">
                    No content scheduled
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Skeletons ────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="space-y-4" data-testid="calendar-skeleton">
      {/* Pipeline skeleton */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      {/* Calendar grid skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 mx-2 my-2 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] border-b border-r p-2">
              <Skeleton className="h-4 w-4 mb-2 rounded" />
              <Skeleton className="h-4 w-full rounded mb-1" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────

export default function ContentCalendar() {
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPiece, setEditPiece] = useState<ContentPiece | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const { toast } = useToast();

  const { data: pieces, isLoading: piecesLoading } = useQuery<ContentPiece[]>({
    queryKey: ["/api/content-pieces"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const isLoading = piecesLoading || clientsLoading;

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, scheduledDate }: { id: string; scheduledDate: string }) => {
      const res = await apiRequest("PATCH", `/api/content-pieces/${id}`, {
        scheduledDate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      toast({ title: "Rescheduled", description: "Content moved to new date." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function handleChipClick(piece: ContentPiece) {
    setEditPiece(piece);
    setDefaultDate("");
    setDialogOpen(true);
  }

  function handleAddContent() {
    setEditPiece(null);
    setDefaultDate("");
    setDialogOpen(true);
  }

  function handleDrop(pieceId: string, newDate: string) {
    rescheduleMutation.mutate({ id: pieceId, scheduledDate: newDate });
  }

  function navigateBack() {
    if (view === "month") {
      setCurrentDate((d) => subMonths(d, 1));
    } else {
      setCurrentDate((d) => subWeeks(d, 1));
    }
  }

  function navigateForward() {
    if (view === "month") {
      setCurrentDate((d) => addMonths(d, 1));
    } else {
      setCurrentDate((d) => addWeeks(d, 1));
    }
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const headerLabel =
    view === "month"
      ? format(currentDate, "MMMM yyyy")
      : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d")} – ${format(
          endOfWeek(currentDate, { weekStartsOn: 0 }),
          "MMM d, yyyy"
        )}`;

  // Find client name for filter display
  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    (clients ?? []).forEach((c) => {
      map[c.id] = c.businessName;
    });
    return map;
  }, [clients]);

  return (
    <div className="flex-1 overflow-auto" data-testid="page-calendar">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-6 py-4" data-testid="calendar-header">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">
              Content Calendar
            </h1>
            <p className="text-sm text-muted-foreground">Plan and schedule your content</p>
          </div>
          <Button onClick={handleAddContent} size="sm" data-testid="button-add-content">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Content
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] space-y-8 px-4 py-5 md:px-6 md:py-8">
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Planner
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Navigate, filter, and schedule with more breathing room
            </h2>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center" data-testid="calendar-nav">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2">
                <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
                  <TabsList data-testid="view-toggle">
                    <TabsTrigger value="month" data-testid="tab-month">
                      Month
                    </TabsTrigger>
                    <TabsTrigger value="week" data-testid="tab-week">
                      Week
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={navigateBack}
                    data-testid="button-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={goToToday}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={navigateForward}
                    data-testid="button-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <span className="text-sm font-semibold lg:ml-1" data-testid="current-date-label">
                {headerLabel}
              </span>
            </div>

            <div className="sm:ml-auto">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[180px] h-8 text-xs" data-testid="select-client-filter">
                  <SelectValue placeholder="All Clients" />
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
            </div>
          </div>
        </section>

        <section className="space-y-4">
        {/* Status Pipeline */}
        {isLoading ? (
          <div className="flex items-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <StatusPipeline pieces={pieces ?? []} />
        )}

        {/* Calendar Body */}
        {isLoading ? (
          <CalendarSkeleton />
        ) : view === "month" ? (
          <MonthView
            currentDate={currentDate}
            pieces={pieces ?? []}
            clientFilter={clientFilter}
            onChipClick={handleChipClick}
            onDrop={handleDrop}
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            pieces={pieces ?? []}
            clientFilter={clientFilter}
            onChipClick={handleChipClick}
          />
        )}
        </section>
      </div>

      {/* Content Dialog */}
      {dialogOpen && (
        <ContentDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditPiece(null);
          }}
          editPiece={editPiece}
          defaultDate={defaultDate}
        />
      )}
    </div>
  );
}
