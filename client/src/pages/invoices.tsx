import { useEffect, useMemo, useState } from "react";
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
  FilePenLine,
  Trash2,
  Building2,
  RefreshCw,
} from "lucide-react";
import type { Client, Contract, InvoiceDraft } from "@shared/schema";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitAmount: number;
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

function draftTotal(lineItems: InvoiceLineItem[]) {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0);
}

const STRIPE_INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  open: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  uncollectible: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  void: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
};

const DRAFT_STATUS_STYLES: Record<string, string> = {
  draft: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  synced: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
  sent: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
};

function InvoiceDraftDialog({
  open,
  onOpenChange,
  clients,
  contracts,
  draft,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  clients: Client[];
  contracts: Contract[];
  draft: InvoiceDraft | null;
}) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [contractId, setContractId] = useState("none");
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [billingCompany, setBillingCompany] = useState("");
  const [billingAbn, setBillingAbn] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 14 days");
  const [dueInDays, setDueInDays] = useState("14");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { description: "", quantity: 1, unitAmount: 0 },
  ]);

  useEffect(() => {
    if (!open) return;

    if (draft) {
      setClientId(draft.clientId);
      setContractId(draft.contractId ?? "none");
      setTitle(draft.title);
      setRecipientName(draft.recipientName);
      setRecipientEmail(draft.recipientEmail ?? "");
      setBillingCompany(draft.billingCompany ?? "");
      setBillingAbn(draft.billingAbn ?? "");
      setPaymentTerms(draft.paymentTerms ?? "Net 14 days");
      setDueInDays(String(draft.dueInDays ?? 14));
      setNotes(draft.notes ?? "");
      setLineItems(
        (draft.lineItems as InvoiceLineItem[] | null)?.length
          ? (draft.lineItems as InvoiceLineItem[])
          : [{ description: "", quantity: 1, unitAmount: 0 }],
      );
      return;
    }

    setClientId("");
    setContractId("none");
    setTitle("");
    setRecipientName("");
    setRecipientEmail("");
    setBillingCompany("");
    setBillingAbn("");
    setPaymentTerms("Net 14 days");
    setDueInDays("14");
    setNotes("");
    setLineItems([{ description: "", quantity: 1, unitAmount: 0 }]);
  }, [draft, open]);

  function applyContract(nextContractId: string) {
    setContractId(nextContractId);
    if (nextContractId === "none") return;

    const selectedContract = contracts.find((contract) => contract.id === nextContractId);
    if (!selectedContract) return;

    const selectedClient = clients.find((client) => client.id === selectedContract.clientId);
    setClientId(selectedContract.clientId);
    setTitle((current) => current || `${selectedClient?.businessName ?? "Client"} Monthly Services`);
    setRecipientName((current) => current || selectedClient?.businessName || "");
    setBillingCompany((current) => current || selectedClient?.businessName || "");
    setPaymentTerms((current) => current || selectedContract.paymentTerms || "Net 14 days");
    setLineItems((current) => {
      const hasMeaningfulItems = current.some((item) => item.description.trim() || item.unitAmount > 0);
      if (hasMeaningfulItems) return current;
      return [
        {
          description: selectedContract.serviceDescription,
          quantity: 1,
          unitAmount: selectedContract.monthlyValue,
        },
      ];
    });
  }

  function updateLineItem(index: number, patch: Partial<InvoiceLineItem>) {
    setLineItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId,
        contractId: contractId === "none" ? null : contractId,
        title,
        recipientName,
        recipientEmail: recipientEmail || null,
        billingCompany: billingCompany || null,
        billingAbn: billingAbn || null,
        paymentTerms: paymentTerms || null,
        dueInDays: Number(dueInDays) || 14,
        notes: notes || null,
        currency: "aud",
        lineItems: lineItems.filter((item) => item.description.trim() && item.unitAmount > 0),
      };

      if (draft) {
        const res = await apiRequest("PATCH", `/api/invoice-drafts/${draft.id}`, payload);
        return res.json();
      }

      const res = await apiRequest("POST", "/api/invoice-drafts", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-drafts"] });
      onOpenChange(false);
      toast({ title: draft ? "Invoice draft updated" : "Invoice draft created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const availableContracts = clientId
    ? contracts.filter((contract) => contract.clientId === clientId)
    : contracts;

  const canSave =
    !!clientId &&
    !!title.trim() &&
    !!recipientName.trim() &&
    lineItems.some((item) => item.description.trim() && item.unitAmount > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-invoice">
        <DialogHeader>
          <DialogTitle>{draft ? "Edit Invoice Draft" : "Create Invoice Draft"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Client *</label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contract</label>
              <Select value={contractId} onValueChange={applyContract}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional contract" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked contract</SelectItem>
                  {availableContracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {formatAUD(contract.monthlyValue)} — {contract.serviceDescription.slice(0, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Invoice Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. April Marketing Retainer" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Recipient Name *</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Client or billing contact" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium">Recipient Email</label>
              <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="billing@company.com" />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium">Billing Company</label>
              <Input value={billingCompany} onChange={(e) => setBillingCompany(e.target.value)} placeholder="e.g. Vartus Holdings Pty Ltd" />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-sm font-medium">ABN</label>
              <Input value={billingAbn} onChange={(e) => setBillingAbn(e.target.value)} placeholder="ABN / tax reference" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Payment Terms</label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 14 days" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Due In Days</label>
              <Input type="number" min="1" value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Line Items</p>
                <p className="text-xs text-muted-foreground">Add as many billable items as you need.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLineItems((current) => [...current, { description: "", quantity: 1, unitAmount: 0 }])}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Line
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-[24px] border border-white/25 bg-white/18 p-4 backdrop-blur-xl md:grid-cols-[1.7fr_0.45fr_0.7fr_auto]">
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(index, { description: e.target.value })}
                    placeholder="Line item description"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={String(item.quantity)}
                    onChange={(e) => updateLineItem(index, { quantity: Number(e.target.value) || 1 })}
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={String(item.unitAmount)}
                    onChange={(e) => updateLineItem(index, { unitAmount: Number(e.target.value) || 0 })}
                    placeholder="Unit amount"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setLineItems((current) =>
                        current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current,
                      )
                    }
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-[24px] border border-white/25 bg-white/14 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Draft total</span>
              <span className="font-semibold">{formatAUD(draftTotal(lineItems))}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Invoice Notes / Footer</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Extra billing notes, banking references, or footer text for Stripe invoices."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!canSave || saveMutation.isPending}
              data-testid="button-submit-invoice"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : draft ? (
                "Save Changes"
              ) : (
                "Create Draft"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<InvoiceDraft | null>(null);

  const { data: invoiceData, isLoading: invoicesLoading } = useQuery<{
    connected: boolean;
    invoices: StripeInvoice[];
  }>({
    queryKey: ["/api/stripe/invoices"],
  });

  const { data: invoiceDrafts, isLoading: draftsLoading } = useQuery<InvoiceDraft[]>({
    queryKey: ["/api/invoice-drafts"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const sendStripeInvoiceMutation = useMutation({
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

  const syncDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const res = await apiRequest("POST", `/api/invoice-drafts/${draftId}/create-stripe-invoice`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/invoices"] });
      toast({ title: "Stripe invoice created", description: "Draft synced to Stripe successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const sendDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const res = await apiRequest("POST", `/api/invoice-drafts/${draftId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/invoices"] });
      toast({ title: "Draft invoice sent", description: "Stripe has sent the synced invoice." });
    },
    onError: (err: Error) => {
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: string) => {
      await apiRequest("DELETE", `/api/invoice-drafts/${draftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-drafts"] });
      toast({ title: "Invoice draft deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const invoices = invoiceData?.invoices ?? [];
  const drafts = invoiceDrafts ?? [];
  const connected = invoiceData?.connected ?? false;

  const filteredStripeInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchSearch =
        !search ||
        (invoice.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (invoice.customerEmail ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || invoice.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const matchSearch =
        !search ||
        draft.title.toLowerCase().includes(search.toLowerCase()) ||
        draft.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        (draft.billingCompany ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || draft.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [drafts, search, statusFilter]);

  const totalPaid = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalOpen = invoices
    .filter((invoice) => invoice.status === "open")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const localDraftCount = drafts.filter((draft) => draft.status === "draft").length;

  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    (clients ?? []).forEach((client) => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  return (
    <div className="flex-1 overflow-auto" data-testid="page-invoices">
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">
              Invoices
            </h1>
            <p className="text-sm text-muted-foreground">
              Build editable invoice drafts and sync them to Stripe when ready
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingDraft(null);
              setDialogOpen(true);
            }}
            data-testid="button-create-invoice"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
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
              Draft custom invoices first, then send polished versions through Stripe
            </h2>
          </div>
          {!invoicesLoading && !draftsLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3" data-testid="invoice-summary">
              <Card className="p-5 glass-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-medium uppercase tracking-wider">Paid in Stripe</span>
                </div>
                <div className="text-2xl font-semibold">{formatAUD(totalPaid)}</div>
              </Card>
              <Card className="p-5 glass-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-medium uppercase tracking-wider">Outstanding</span>
                </div>
                <div className="text-2xl font-semibold">{formatAUD(totalOpen)}</div>
              </Card>
              <Card className="p-5 glass-card">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FilePenLine className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Local Drafts</span>
                </div>
                <div className="text-2xl font-semibold">{localDraftCount}</div>
              </Card>
            </div>
          )}
        </section>

        {!connected && !invoicesLoading && (
          <Card className="p-6 text-center glass-card">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium">Stripe not configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              You can still build local drafts now and sync them later once Stripe is connected.
            </p>
          </Card>
        )}

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Draft Workspace
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Edit billing names, ABNs, line items, and notes before syncing
            </h2>
          </div>

          {draftsLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="glass-card">
                  <CardContent className="space-y-3 p-5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDrafts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/35 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground">No invoice drafts yet</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground/70">
                  Create a draft invoice first so you can customise the billing entity, ABN, line items, and notes before sending it to Stripe.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredDrafts.map((draft) => {
                const lineItems = (draft.lineItems as InvoiceLineItem[] | null) ?? [];
                const linkedClient = clientMap[draft.clientId];
                return (
                  <Card key={draft.id} className="glass-card overflow-hidden">
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{draft.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {linkedClient?.businessName || draft.recipientName}
                          </p>
                        </div>
                        <Badge variant="outline" className={DRAFT_STATUS_STYLES[draft.status] ?? ""}>
                          {draft.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-[22px] border border-white/25 bg-white/14 p-4 backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          Billing details
                        </div>
                        <p className="mt-3 text-sm font-medium">{draft.billingCompany || draft.recipientName}</p>
                        {draft.billingAbn && (
                          <p className="mt-1 text-xs text-muted-foreground">ABN: {draft.billingAbn}</p>
                        )}
                        {draft.recipientEmail && (
                          <p className="mt-1 text-xs text-muted-foreground">{draft.recipientEmail}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        {lineItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-start justify-between gap-3 text-sm">
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                            </div>
                            <span className="font-medium">{formatAUD(item.quantity * item.unitAmount)}</span>
                          </div>
                        ))}
                        {lineItems.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{lineItems.length - 2} more line items</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-white/15 pt-3">
                        <span className="text-sm text-muted-foreground">Draft total</span>
                        <span className="text-lg font-semibold">{formatAUD(draftTotal(lineItems))}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDraft(draft);
                            setDialogOpen(true);
                          }}
                        >
                          <FilePenLine className="h-4 w-4 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => syncDraftMutation.mutate(draft.id)}
                          disabled={syncDraftMutation.isPending || !connected}
                        >
                          {syncDraftMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1.5" />
                          )}
                          Sync to Stripe
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendDraftMutation.mutate(draft.id)}
                          disabled={!draft.stripeInvoiceId || sendDraftMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1.5" />
                          Send
                        </Button>
                        {draft.stripeInvoiceUrl && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(draft.stripeInvoiceUrl!, "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                        )}
                        {draft.stripeInvoicePdf && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(draft.stripeInvoicePdf!, "_blank")}>
                            <Download className="h-4 w-4 mr-1.5" />
                            PDF
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:text-rose-600"
                          onClick={() => deleteDraftMutation.mutate(draft.id)}
                          disabled={deleteDraftMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
              Stripe History
            </p>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-white">
              Search and review live Stripe invoices
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices or drafts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-invoices"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {invoicesLoading ? (
            <Card className="glass-card">
              <CardContent className="p-0">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : filteredStripeInvoices.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  {invoices.length > 0 ? "No Stripe invoices match your filters" : "No Stripe invoices yet"}
                </h3>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Sync one of your draft invoices to Stripe to start billing clients.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
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
                    {filteredStripeInvoices.map((invoice) => (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{invoice.customerName ?? "—"}</p>
                            {invoice.customerEmail && (
                              <p className="text-xs text-muted-foreground">{invoice.customerEmail}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatAUD(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STRIPE_INVOICE_STATUS_STYLES[invoice.status] ?? ""}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(invoice.created)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {invoice.status === "open" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Send invoice"
                                onClick={() => sendStripeInvoiceMutation.mutate(invoice.id)}
                                disabled={sendStripeInvoiceMutation.isPending}
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {invoice.invoiceUrl && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="View invoice"
                                onClick={() => window.open(invoice.invoiceUrl!, "_blank")}
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {invoice.invoicePdf && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Download PDF"
                                onClick={() => window.open(invoice.invoicePdf!, "_blank")}
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
        </section>
      </div>

      <InvoiceDraftDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients ?? []}
        contracts={contracts ?? []}
        draft={editingDraft}
      />
    </div>
  );
}
