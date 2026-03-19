import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Users,
  DollarSign,
  TrendingUp,
  Trophy,
  Mail,
  Phone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  GripVertical,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lead, InsertLead } from "@shared/schema";
import { insertLeadSchema } from "@shared/schema";

// ── Constants ────────────────────────────────────────

const STAGES = ["new", "contacted", "proposal", "negotiating", "won", "lost"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_CONFIG: Record<
  Stage,
  { label: string; color: string; bgLight: string; bgDark: string; textColor: string }
> = {
  new: {
    label: "New",
    color: "bg-blue-500",
    bgLight: "bg-blue-50 border-blue-200",
    bgDark: "dark:bg-blue-950/30 dark:border-blue-800/40",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  contacted: {
    label: "Contacted",
    color: "bg-amber-500",
    bgLight: "bg-amber-50 border-amber-200",
    bgDark: "dark:bg-amber-950/30 dark:border-amber-800/40",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  proposal: {
    label: "Proposal",
    color: "bg-purple-500",
    bgLight: "bg-purple-50 border-purple-200",
    bgDark: "dark:bg-purple-950/30 dark:border-purple-800/40",
    textColor: "text-purple-700 dark:text-purple-300",
  },
  negotiating: {
    label: "Negotiating",
    color: "bg-orange-500",
    bgLight: "bg-orange-50 border-orange-200",
    bgDark: "dark:bg-orange-950/30 dark:border-orange-800/40",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  won: {
    label: "Won",
    color: "bg-green-500",
    bgLight: "bg-green-50 border-green-200",
    bgDark: "dark:bg-green-950/30 dark:border-green-800/40",
    textColor: "text-green-700 dark:text-green-300",
  },
  lost: {
    label: "Lost",
    color: "bg-red-500",
    bgLight: "bg-red-50 border-red-200",
    bgDark: "dark:bg-red-950/30 dark:border-red-800/40",
    textColor: "text-red-700 dark:text-red-300",
  },
};

const STAGE_BADGE: Record<Stage, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  proposal: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  negotiating: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  won: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  lost: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

// ── Helpers ──────────────────────────────────────────

function formatAUD(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

// ── Form Schema ──────────────────────────────────────

const leadFormSchema = insertLeadSchema.extend({
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  proposalValue: z.coerce.number().min(0, "Value must be positive").default(0),
  notes: z.string().optional().nullable(),
  stage: z.enum(STAGES).default("new"),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

// ── Sortable Lead Card ───────────────────────────────

function SortableLeadCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} data-testid={`card-lead-${lead.id}`}>
      <LeadCardContent
        lead={lead}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function LeadCardContent({
  lead,
  onEdit,
  onDelete,
  dragHandleProps,
  isOverlay,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  dragHandleProps?: Record<string, unknown>;
  isOverlay?: boolean;
}) {
  const stage = lead.stage as Stage;

  return (
    <Card
      className={`p-3 border shadow-sm hover:shadow-md transition-shadow cursor-default ${
        isOverlay ? "shadow-lg ring-2 ring-primary/20 rotate-2" : ""
      }`}
      data-testid={`card-content-lead-${lead.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0"
            {...dragHandleProps}
            data-testid={`drag-handle-${lead.id}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p
              className="font-semibold text-sm leading-tight truncate"
              data-testid={`text-contact-${lead.id}`}
            >
              {lead.contactName}
            </p>
            {lead.company && (
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <p
                  className="text-xs text-muted-foreground truncate"
                  data-testid={`text-company-${lead.id}`}
                >
                  {lead.company}
                </p>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              data-testid={`button-menu-${lead.id}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={() => onEdit(lead)}
              data-testid={`button-edit-${lead.id}`}
            >
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(lead)}
              className="text-destructive focus:text-destructive"
              data-testid={`button-delete-${lead.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span
          className="text-sm font-medium tabular-nums"
          data-testid={`text-value-${lead.id}`}
        >
          {formatAUD(lead.proposalValue)}
        </span>
        <div className="flex items-center gap-1.5">
          {lead.email && (
            <Mail
              className="h-3.5 w-3.5 text-muted-foreground"
              data-testid={`icon-email-${lead.id}`}
            />
          )}
          {lead.phone && (
            <Phone
              className="h-3.5 w-3.5 text-muted-foreground"
              data-testid={`icon-phone-${lead.id}`}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Kanban Column ────────────────────────────────────

function KanbanColumn({
  stage,
  leads,
  onEdit,
  onDelete,
}: {
  stage: Stage;
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const config = STAGE_CONFIG[stage];
  const totalValue = leads.reduce((sum, l) => sum + (l.proposalValue ?? 0), 0);
  const leadIds = leads.map((l) => l.id);

  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      className={`flex flex-col w-72 shrink-0 rounded-lg border ${config.bgLight} ${config.bgDark} transition-colors ${
        isOver ? "ring-2 ring-primary/30" : ""
      }`}
      data-testid={`column-${stage}`}
    >
      {/* Column Header */}
      <div className="px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            <h3
              className={`text-sm font-semibold ${config.textColor}`}
              data-testid={`text-column-title-${stage}`}
            >
              {config.label}
            </h3>
            <Badge
              variant="secondary"
              className="h-5 min-w-5 flex items-center justify-center px-1.5 text-xs"
              data-testid={`badge-count-${stage}`}
            >
              {leads.length}
            </Badge>
          </div>
        </div>
        <p
          className="text-xs text-muted-foreground mt-1 tabular-nums"
          data-testid={`text-column-value-${stage}`}
        >
          {formatAUD(totalValue)}
        </p>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px]"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lead Form Dialog ─────────────────────────────────

function LeadFormDialog({
  open,
  onOpenChange,
  editingLead,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLead: Lead | null;
}) {
  const isEditing = !!editingLead;

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      contactName: "",
      email: "",
      phone: "",
      company: "",
      proposalValue: 0,
      notes: "",
      stage: "new",
    },
    values: editingLead
      ? {
          contactName: editingLead.contactName,
          email: editingLead.email ?? "",
          phone: editingLead.phone ?? "",
          company: editingLead.company ?? "",
          proposalValue: editingLead.proposalValue ?? 0,
          notes: editingLead.notes ?? "",
          stage: (editingLead.stage as Stage) ?? "new",
        }
      : undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      const res = await apiRequest("POST", "/api/leads", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LeadFormValues) => {
      const res = await apiRequest("PATCH", `/api/leads/${editingLead!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: LeadFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-lead-form">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the lead details below."
              : "Fill in the details to create a new lead."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="form-lead"
          >
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Smith"
                      {...field}
                      data-testid="input-contact-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+61 400 000 000"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Corp"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-company"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="proposalValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Value (AUD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="5000"
                        {...field}
                        data-testid="input-proposal-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-stage">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s} data-testid={`option-stage-${s}`}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${STAGE_CONFIG[s].color}`}
                            />
                            {STAGE_CONFIG[s].label}
                          </div>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-lead"
              >
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Add Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Stats Row ────────────────────────────────────────

function StatsRow({ leads }: { leads: Lead[] }) {
  const totalLeads = leads.length;
  const pipelineValue = leads
    .filter((l) => l.stage !== "lost")
    .reduce((sum, l) => sum + (l.proposalValue ?? 0), 0);
  const wonValue = leads
    .filter((l) => l.stage === "won")
    .reduce((sum, l) => sum + (l.proposalValue ?? 0), 0);
  const conversionRate =
    totalLeads > 0
      ? ((leads.filter((l) => l.stage === "won").length / totalLeads) * 100).toFixed(1)
      : "0.0";

  const stats = [
    {
      label: "Total Leads",
      value: totalLeads.toString(),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      testId: "stat-total-leads",
    },
    {
      label: "Pipeline Value",
      value: formatAUD(pipelineValue),
      icon: DollarSign,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      testId: "stat-pipeline-value",
    },
    {
      label: "Won Value",
      value: formatAUD(wonValue),
      icon: Trophy,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/40",
      testId: "stat-won-value",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      testId: "stat-conversion-rate",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="stats-row">
      {stats.map((stat) => (
        <Card
          key={stat.testId}
          className="px-4 py-3 flex items-center gap-3"
          data-testid={stat.testId}
        >
          <div className={`p-2 rounded-lg ${stat.bg}`}>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-base font-semibold tabular-nums" data-testid={`value-${stat.testId}`}>
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="px-4 py-3 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </Card>
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-xs" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Columns skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-72 shrink-0 rounded-lg border bg-muted/30 p-3 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
            <Skeleton className="h-3 w-16" />
            <div className="space-y-2 pt-2">
              {Array.from({ length: 2 + (i % 2) }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function SalesPipeline() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  // Update stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await apiRequest("PATCH", `/api/leads/${id}`, { stage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.contactName.toLowerCase().includes(q) ||
          (l.company && l.company.toLowerCase().includes(q))
      );
    }

    if (stageFilter !== "all") {
      result = result.filter((l) => l.stage === stageFilter);
    }

    return result;
  }, [leads, searchQuery, stageFilter]);

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const map: Record<Stage, Lead[]> = {
      new: [],
      contacted: [],
      proposal: [],
      negotiating: [],
      won: [],
      lost: [],
    };

    for (const lead of filteredLeads) {
      const stage = lead.stage as Stage;
      if (map[stage]) {
        map[stage].push(lead);
      }
    }
    return map;
  }, [filteredLeads]);

  // Active drag lead
  const activeLead = useMemo(
    () => (activeId ? leads.find((l) => l.id === activeId) : null),
    [activeId, leads]
  );

  // DnD handlers
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(_event: DragOverEvent) {
    // We use handleDragEnd for the actual move
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    // Determine target stage
    let targetStage: string | null = null;

    // Check if dropped on a column (droppable ID is the stage name)
    if (STAGES.includes(over.id as Stage)) {
      targetStage = over.id as string;
    } else {
      // Dropped on another card — find which stage that card is in
      const overLead = leads.find((l) => l.id === over.id);
      if (overLead) {
        targetStage = overLead.stage;
      }
    }

    if (targetStage && targetStage !== lead.stage) {
      updateStageMutation.mutate({ id: leadId, stage: targetStage });
    }
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  // Edit / delete handlers
  function handleEdit(lead: Lead) {
    setEditingLead(lead);
    setDialogOpen(true);
  }

  function handleDelete(lead: Lead) {
    deleteMutation.mutate(lead.id);
  }

  function handleOpenAdd() {
    setEditingLead(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="page-sales">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-6 py-4 shrink-0">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <h1 className="text-lg font-semibold" data-testid="page-title">
          Sales Pipeline
        </h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-5">
        {isLoading ? (
          <KanbanSkeleton />
        ) : (
          <>
            {/* Stats Row */}
            <StatsRow leads={leads} />

            {/* Search / Filter / Add Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="input-search"
                />
              </div>

              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-40" data-testid="select-filter-stage">
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-filter-all">
                    All Stages
                  </SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s} data-testid={`option-filter-${s}`}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${STAGE_CONFIG[s].color}`}
                        />
                        {STAGE_CONFIG[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleOpenAdd}
                className="ml-auto"
                data-testid="button-add-lead"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Lead
              </Button>
            </div>

            {/* Kanban Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div
                className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
                data-testid="kanban-board"
              >
                {STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    leads={leadsByStage[stage]}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeLead ? (
                  <div className="w-72">
                    <LeadCardContent
                      lead={activeLead}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isOverlay
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* Form Dialog */}
      <LeadFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingLead(null);
        }}
        editingLead={editingLead}
      />
    </div>
  );
}
