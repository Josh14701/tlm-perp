import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, Globe, Calendar } from "lucide-react";
import type { Client } from "@shared/schema";

// ── Helpers ─────────────────────────────────────────

function formatAUD(value: number | null | undefined): string {
  if (value == null) return "$0.00";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  onboarding: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  paused: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  churned: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
};

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── Form Schema ────────────────────────────────────

const clientFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  website: z.string().optional(),
  mrr: z.coerce.number().min(0).optional(),
  status: z.string().default("onboarding"),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

// ── Add Client Dialog ───────────────────────────────

function AddClientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      businessName: "",
      industry: "",
      website: "",
      mrr: 0,
      status: "onboarding",
      contractStart: "",
      contractEnd: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const res = await apiRequest("POST", "/api/clients", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      form.reset();
      onOpenChange(false);
      toast({ title: "Client created", description: "New client has been added successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: ClientFormValues) {
    createMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-add-client">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-add-client">Add New Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-add-client">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} data-testid="input-business-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SaaS, Retail" {...field} data-testid="input-industry" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mrr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRR (AUD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} data-testid="input-mrr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} data-testid="input-website" />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" data-testid="input-contract-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" data-testid="input-contract-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." rows={3} {...field} data-testid="input-notes" />
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
                data-testid="button-cancel-add-client"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add-client">
                {createMutation.isPending ? "Creating..." : "Add Client"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Client Card ─────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
        data-testid={`card-client-${client.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors" data-testid={`text-client-name-${client.id}`}>
              {client.businessName}
            </CardTitle>
            <Badge
              className={STATUS_STYLES[client.status] || ""}
              variant="outline"
              data-testid={`badge-status-${client.id}`}
            >
              {statusLabel(client.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {client.industry && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-industry-${client.id}`}>
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{client.industry}</span>
            </div>
          )}
          {client.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`text-website-${client.id}`}>
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{client.website}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-sm font-semibold" data-testid={`text-mrr-${client.id}`}>
              {formatAUD(client.mrr)} <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </span>
            {(client.contractStart || client.contractEnd) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-contract-dates-${client.id}`}>
                <Calendar className="h-3 w-3" />
                {client.contractStart && <span>{client.contractStart}</span>}
                {client.contractStart && client.contractEnd && <span>–</span>}
                {client.contractEnd && <span>{client.contractEnd}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Loading Skeleton ────────────────────────────────

function ClientCardSkeleton() {
  return (
    <Card data-testid="skeleton-client-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-36" />
        <div className="flex items-center justify-between pt-1 border-t">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ───────────────────────────────────────

export default function Clients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filtered = (clients ?? []).filter((c) => {
    const matchesSearch =
      !search || c.businessName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-auto" data-testid="page-clients">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <h1 className="text-lg font-semibold" data-testid="page-title">Clients</h1>
        <div className="ml-auto">
          <Button onClick={() => setDialogOpen(true)} size="sm" data-testid="button-add-client">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Client
          </Button>
        </div>
      </header>

      {/* Filter Row */}
      <div className="px-6 py-4 flex flex-col sm:flex-row gap-3" data-testid="filter-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-clients"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Grid */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-clients-loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <ClientCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state-clients">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {clients && clients.length > 0 ? "No clients match your filters" : "No clients yet"}
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {clients && clients.length > 0
                ? "Try adjusting your search or status filter."
                : "Get started by adding your first client."}
            </p>
            {(!clients || clients.length === 0) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setDialogOpen(true)}
                data-testid="button-add-client-empty"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Client
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-clients">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>

      <AddClientDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
