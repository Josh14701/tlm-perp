import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Receipt,
  Plus,
  Search,
  ExternalLink,
  Download,
  Send,
  Loader2,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { Client, Contract } from "@shared/schema";

// ── Helpers ──────────────────────────────────────────

function formatAUD(value: number | null | undefined): string {
  if (value == null) return "$0";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  open: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  uncollectible: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  void: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
};

interface StripeInvoice {
  id: string;
  customerName: string | null;
  customerEmail: string | null;
  amount: number;
  currency: string;
  status: string;
  dueDate: string | null;
  invoiceUrl: string | null;
  invoicePdf: string | null;
  created: string;
  contractId: string | null;
}

// ── Create Invoice Dialog ───────────────────────────

function CreateInvoiceDialog({
  open,
  onOpenChange,
  clients,
  contracts,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Client[];
  contracts: Contract[];
}) {
  const { toast } = useToast();
  const [selectedContractId, setSelectedContractId] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");

  const selectedContract = contracts.find((c) => c.id === selectedContractId);
  const clientName = selectedContract
    ? clients.find((c) => c.id === selectedContract.clientId)?.businessName ?? "Client"
    : "";

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-invoice", {
        contractId: selectedContractId,
        customerEmail: email,
        description: description || undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/invoices"] });
      onOpenChange(false);
      setSelectedContractId("");
      setEmail("");
      setDescription("");
      toast({
        title: "Invoice created",
        description: data.invoiceUrl ? "Invoice ready to send." : "Invoice created in Stripe.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-create-invoice">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Contract *</label>
            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
              <SelectTrigger data-testid="select-invoice-contract">
                <SelectValue placeholder="Select a contract" />
              </SelectTrigger>
              <SelectContent>
                {contracts
                  .filter((c) => c.status === "active" || c.status === "signed")
                  .map((c) => {
                    const client = clients.find((cl) => cl.id === c.clientId);
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {client?.businessName ?? "Unknown"} — {formatAUD(c.monthlyValue)}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {selectedContract && (
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              <p className="font-medium">{clientName}</p>
              <p className="text-muted-foreground text-xs mt-1 truncate">
                {selectedContract.serviceDescription}
              </p>
              <p className="font-semibold mt-1">{formatAUD(selectedContract.monthlyValue)}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Customer Email *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              data-testid="input-invoice-email"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Custom line item description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!selectedContractId || !email.trim() || createMutation.isPending}
              data-testid="button-submit-invoice"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Invoice"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────

export default function Invoices() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: invoiceData, isLoading: invoicesLoading } = useQuery<{
    connected: boolean;
    invoices: StripeInvoice[];
  }>({
    queryKey: ["/api/stripe/invoices"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const sendMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await apiRequest("POST", "/api/stripe/send-invoice", { invoiceId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/invoices"] });
      toast({ title: "Invoice sent", description: "Invoice email sent to customer." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const invoices = invoiceData?.invoices ?? [];
  const connected = invoiceData?.connected ?? false;

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !search ||
        (inv.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.customerEmail ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  // Summary stats
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOpen = invoices
    .filter((i) => i.status === "open")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalDraft = invoices.filter((i) => i.status === "draft").length;

  return (
    <div className="flex-1 overflow-auto" data-testid="page-invoices">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold" data-testid="page-title">
            Invoices
          </h1>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-invoice">
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        {!invoicesLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="invoice-summary">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium uppercase tracking-wider">Paid</span>
              </div>
              <div className="text-2xl font-semibold">{formatAUD(totalPaid)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium uppercase tracking-wider">Outstanding</span>
              </div>
              <div className="text-2xl font-semibold">{formatAUD(totalOpen)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
              </div>
              <div className="text-2xl font-semibold">{totalDraft}</div>
            </Card>
          </div>
        )}

        {!connected && !invoicesLoading && (
          <Card className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium">Stripe not configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your STRIPE_SECRET_KEY environment variable to enable invoicing.
            </p>
          </Card>
        )}

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-invoices"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="uncollectible">Uncollectible</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        {invoicesLoading ? (
          <Card>
            <CardContent className="p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {invoices.length > 0 ? "No invoices match your filters" : "No invoices yet"}
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create your first invoice from a contract to get started.
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => (
                    <TableRow key={inv.id} data-testid={`row-invoice-${inv.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {inv.customerName ?? "—"}
                          </p>
                          {inv.customerEmail && (
                            <p className="text-xs text-muted-foreground">{inv.customerEmail}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAUD(inv.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={INVOICE_STATUS_STYLES[inv.status] ?? ""}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(inv.created)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {inv.status === "open" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Send invoice"
                              onClick={() => sendMutation.mutate(inv.id)}
                              disabled={sendMutation.isPending}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {inv.invoiceUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="View invoice"
                              onClick={() => window.open(inv.invoiceUrl!, "_blank")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {inv.invoicePdf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Download PDF"
                              onClick={() => window.open(inv.invoicePdf!, "_blank")}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateInvoiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients ?? []}
        contracts={contracts ?? []}
      />
    </div>
  );
}
