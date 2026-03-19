import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Plus,
  Search,
  FileText,
  Send,
  Download,
  PenLine,
  Copy,
  ExternalLink,
  Calendar,
  DollarSign,
  Receipt,
  Link,
  Loader2,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock,
  User,
  Building2,
} from "lucide-react";
import type { Contract, Client, ShareLink } from "@shared/schema";

// ── Helpers ──────────────────────────────────────────

function formatAUD(value: number | null | undefined): string {
  if (value == null) return "$0.00";
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

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  signed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  active: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/25",
  expired: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
};

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── Form Schema ──────────────────────────────────────

const contractFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  serviceDescription: z.string().min(1, "Service description is required"),
  monthlyValue: z.coerce.number().min(0, "Monthly value must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  gstHandling: z.string().default("inclusive"),
});

type ContractFormValues = z.infer<typeof contractFormSchema>;

// ── Create Contract Dialog ───────────────────────────

function CreateContractDialog({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}) {
  const { toast } = useToast();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientId: "",
      serviceDescription: "",
      monthlyValue: 0,
      startDate: "",
      endDate: "",
      paymentTerms: "",
      gstHandling: "inclusive",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ContractFormValues) => {
      const res = await apiRequest("POST", "/api/contracts", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      form.reset();
      onOpenChange(false);
      toast({ title: "Contract created", description: "New contract has been added." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // AI generate mutation
  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues();
      const res = await apiRequest("POST", "/api/ai/generate-contract", values);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.contractText) {
        form.setValue("serviceDescription", data.contractText);
        toast({ title: "Contract generated", description: "AI-generated contract text has been inserted." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "AI generation failed", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: ContractFormValues) {
    createMutation.mutate(values);
  }

  const watchClient = form.watch("clientId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-create-contract">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-create-contract">Create Contract</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-create-contract">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contract-client">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
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
              name="serviceDescription"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Service Description *</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                      disabled={!watchClient || aiGenerateMutation.isPending}
                      onClick={() => aiGenerateMutation.mutate()}
                      data-testid="button-ai-generate"
                    >
                      {aiGenerateMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {aiGenerateMutation.isPending ? "Generating..." : "AI Generate"}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Social media management, content creation... or use AI Generate to auto-fill"
                      rows={5}
                      {...field}
                      data-testid="input-service-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Value (AUD) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} data-testid="input-monthly-value" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" data-testid="input-start-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" data-testid="input-end-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Net 14, due on the 1st of each month..."
                      rows={2}
                      {...field}
                      data-testid="input-payment-terms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gstHandling"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Handling</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-gst-handling">
                        <SelectValue placeholder="Select GST handling" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inclusive">GST Inclusive</SelectItem>
                      <SelectItem value="exclusive">GST Exclusive</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-create-contract"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-contract">
                {createMutation.isPending ? "Creating..." : "Create Contract"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Signature Display Component ─────────────────────

function SignatureBlock({
  party,
  label,
  icon: Icon,
  signature,
  signedAt,
  onSign,
  isPending,
  editable,
}: {
  party: "agency" | "client";
  label: string;
  icon: any;
  signature: string | null | undefined;
  signedAt?: string | null;
  onSign?: (name: string) => void;
  isPending?: boolean;
  editable?: boolean;
}) {
  const [name, setName] = useState("");

  const isSigned = !!signature;
  const isDataUri = signature?.startsWith("data:");

  return (
    <div
      className={`rounded-xl border-2 p-5 transition-all ${
        isSigned
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
          : "border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/30"
      }`}
      data-testid={`signature-block-${party}`}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isSigned
              ? "bg-emerald-100 dark:bg-emerald-900/40"
              : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          {isSigned ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Icon className={`h-4 w-4 ${party === "agency" ? "text-indigo-500" : "text-blue-500"}`} />
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold">{label}</h4>
          <p className="text-xs text-muted-foreground">
            {isSigned ? `Signed ${formatDate(signedAt)}` : "Awaiting signature"}
          </p>
        </div>
        {isSigned && (
          <Badge
            variant="outline"
            className="ml-auto bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px]"
          >
            Signed
          </Badge>
        )}
        {!isSigned && (
          <Badge
            variant="outline"
            className="ml-auto bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25 text-[10px]"
          >
            <Clock className="h-2.5 w-2.5 mr-1" />
            Pending
          </Badge>
        )}
      </div>

      {isSigned ? (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
          {isDataUri ? (
            <img src={signature!} alt="Signature" className="h-12 object-contain" data-testid={`img-signature-${party}`} />
          ) : (
            <p className="font-serif italic text-xl text-gray-800 dark:text-gray-200" data-testid={`text-signature-${party}`}>
              {signature}
            </p>
          )}
        </div>
      ) : editable && onSign ? (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1.5 block">Type your name to sign</label>
              <Input
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid={`input-signature-${party}`}
              />
              {name && (
                <p className="mt-2 font-serif italic text-lg text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600 pb-1">
                  {name}
                </p>
              )}
            </div>
            <Button
              size="sm"
              disabled={!name.trim() || isPending}
              onClick={() => onSign(name)}
              data-testid={`button-sign-${party}`}
            >
              <PenLine className="h-4 w-4 mr-1.5" />
              {isPending ? "Signing..." : "Sign"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-sm text-muted-foreground/60 italic">
            {party === "client" ? "Client will sign via the shared portal link" : "Awaiting signature"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Contract Detail Dialog ───────────────────────────

function ContractDetailDialog({
  open,
  onOpenChange,
  contract,
  clientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  clientName: string;
}) {
  const { toast } = useToast();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  // All hooks must be called before any early return
  const contractId = contract?.id ?? "";
  const contractClientId = contract?.clientId ?? "";

  // Agency sign mutation — uses dedicated endpoint
  const agencySignMutation = useMutation({
    mutationFn: async (agencySignature: string) => {
      const res = await apiRequest("PATCH", `/api/contracts/${contractId}/sign`, {
        agencySignature,
        agencySignerName: agencySignature,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract signed", description: "Agency signature has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create Invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-invoice", {
        contractId,
        customerEmail: invoiceEmail,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setInvoiceDialogOpen(false);
      setInvoiceEmail("");
      toast({
        title: "Invoice created",
        description: data.invoiceUrl
          ? `Invoice ready: ${data.invoiceUrl}`
          : "Invoice has been created in Stripe.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Invoice failed", description: error.message, variant: "destructive" });
    },
  });

  // Stripe Checkout mutation — creates recurring subscription session
  const stripeCheckoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/checkout", {
        contractId,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast({ title: "Stripe Checkout opened", description: "Redirecting to Stripe to set up payment..." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    },
  });

  // Send to client mutation — creates a share link
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/share", {
        type: "contract",
        resourceId: contractId,
        clientId: contractClientId,
      });
      return res.json() as Promise<ShareLink>;
    },
    onSuccess: (data: ShareLink) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      const link = `${window.location.origin}/#/share/${data.token}`;
      setShareLink(link);
      toast({ title: "Share link created", description: "The contract share link has been generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/contracts/${contractId}`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!contract) return null;

  const bothSigned = !!(contract.agencySignature && contract.clientSignature);

  function handleDownloadPDF() {
    if (!contract) return;
    const gstLabel =
      contract.gstHandling === "inclusive"
        ? "GST Inclusive"
        : contract.gstHandling === "exclusive"
          ? "GST Exclusive"
          : "N/A";

    const text = [
      `CONTRACT — ${clientName}`,
      `${"=".repeat(50)}`,
      ``,
      `Status: ${statusLabel(contract.status)}`,
      ``,
      `SERVICE DESCRIPTION`,
      contract.serviceDescription,
      ``,
      `MONTHLY VALUE: ${formatAUD(contract.monthlyValue)} (${gstLabel})`,
      ``,
      `DATES`,
      `Start: ${formatDate(contract.startDate)}`,
      `End: ${formatDate(contract.endDate)}`,
      ``,
      contract.paymentTerms ? `PAYMENT TERMS\n${contract.paymentTerms}\n` : "",
      ``,
      `${"─".repeat(50)}`,
      `PARTY 1 — AGENCY`,
      contract.agencySignature
        ? `Signature: ${contract.agencySignature}\nSigned: ${formatDate(contract.signedAt)}`
        : "Signature: _________________________ (Pending)",
      ``,
      `PARTY 2 — CLIENT (${clientName})`,
      contract.clientSignature
        ? `Signature: ${contract.clientSignature?.startsWith("data:") ? "[Drawn Signature]" : contract.clientSignature}`
        : "Signature: _________________________ (Pending)",
      ``,
      `${"=".repeat(50)}`,
      `Generated on ${new Date().toLocaleDateString("en-AU")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${clientName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Contract summary has been downloaded." });
  }

  function copyShareLink() {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({ title: "Copied", description: "Share link copied to clipboard." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setShareLink(null); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-contract-detail">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle data-testid="dialog-title-contract-detail">
              Contract — {clientName}
            </DialogTitle>
            <Badge
              variant="outline"
              className={STATUS_STYLES[contract.status] || ""}
              data-testid="badge-detail-status"
            >
              {statusLabel(contract.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Service Details */}
          <div className="space-y-3" data-testid="section-service-details">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Service Description</h3>
            <div className="text-sm leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto rounded-lg bg-muted/30 p-3" data-testid="text-detail-service">
              {contract.serviceDescription}
            </div>
          </div>

          {/* Financial */}
          <div className="grid grid-cols-2 gap-4" data-testid="section-financials">
            <Card className="p-4 glass-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Monthly Value</span>
              </div>
              <p className="text-lg font-semibold" data-testid="text-detail-value">
                {formatAUD(contract.monthlyValue)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-detail-gst">
                {contract.gstHandling === "inclusive"
                  ? "GST Inclusive"
                  : contract.gstHandling === "exclusive"
                    ? "GST Exclusive"
                    : "N/A"}
              </p>
            </Card>
            <Card className="p-4 glass-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Contract Period</span>
              </div>
              <p className="text-sm font-medium" data-testid="text-detail-dates">
                {formatDate(contract.startDate)} — {formatDate(contract.endDate)}
              </p>
            </Card>
          </div>

          {/* Payment Terms */}
          {contract.paymentTerms && (
            <div className="space-y-2" data-testid="section-payment-terms">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</h3>
              <p className="text-sm leading-relaxed" data-testid="text-detail-payment-terms">
                {contract.paymentTerms}
              </p>
            </div>
          )}

          {/* ═══ DUAL-PARTY SIGNATURE SECTION ═══ */}
          <div className="space-y-3" data-testid="section-signatures">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Signatures</h3>
              {bothSigned && (
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px]">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  Fully Executed
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Party 1: Agency */}
              <SignatureBlock
                party="agency"
                label="Party 1 — Agency"
                icon={Building2}
                signature={contract.agencySignature}
                signedAt={contract.signedAt}
                onSign={(name) => agencySignMutation.mutate(name)}
                isPending={agencySignMutation.isPending}
                editable={!contract.agencySignature}
              />

              {/* Party 2: Client */}
              <SignatureBlock
                party="client"
                label={`Party 2 — Client (${clientName})`}
                icon={User}
                signature={contract.clientSignature}
                signedAt={contract.clientSignature ? contract.signedAt : undefined}
                editable={false}
              />
            </div>
          </div>

          {/* ═══ STRIPE PAYMENT SECTION ═══ */}
          {bothSigned && (
            <div
              className="rounded-xl border-2 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-5"
              data-testid="section-stripe-payment"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Setup Recurring Payment</h4>
                  <p className="text-xs text-muted-foreground">
                    Both parties have signed. Set up automatic billing via Stripe.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => stripeCheckoutMutation.mutate()}
                  disabled={stripeCheckoutMutation.isPending}
                  data-testid="button-stripe-checkout"
                >
                  {stripeCheckoutMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                  )}
                  {stripeCheckoutMutation.isPending ? "Opening Stripe..." : `Setup ${formatAUD(contract.monthlyValue)}/mo Subscription`}
                </Button>
              </div>
            </div>
          )}

          {/* Share Link */}
          {shareLink && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2" data-testid="section-share-link">
              <h3 className="text-sm font-medium">Client Signing Link</h3>
              <p className="text-xs text-muted-foreground">Send this link to the client so they can review and sign the contract.</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareLink}
                  className="text-xs font-mono"
                  data-testid="input-share-link"
                />
                <Button size="sm" variant="outline" onClick={copyShareLink} data-testid="button-copy-share-link">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 border-t pt-4" data-testid="section-contract-actions">
            {/* Send to client — creates share link for client signing */}
            <Button
              size="sm"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              data-testid="button-send-to-client"
            >
              <Send className="h-4 w-4 mr-1.5" />
              {sendMutation.isPending ? "Generating..." : "Send to Client"}
            </Button>

            {contract.status === "signed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate("active")}
                disabled={statusMutation.isPending}
                data-testid="button-activate-contract"
              >
                Activate Contract
              </Button>
            )}

            {contract.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate("expired")}
                disabled={statusMutation.isPending}
                data-testid="button-expire-contract"
              >
                Mark Expired
              </Button>
            )}

            {contract.status !== "cancelled" && contract.status !== "expired" && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200 dark:border-red-800"
                onClick={() => statusMutation.mutate("cancelled")}
                disabled={statusMutation.isPending}
                data-testid="button-cancel-contract"
              >
                Cancel Contract
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPDF}
              data-testid="button-download-contract"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setInvoiceDialogOpen(true)}
              data-testid="button-create-invoice"
            >
              <Receipt className="h-4 w-4 mr-1.5" />
              Invoice
            </Button>
          </div>
        </div>

        {/* Invoice Email Dialog */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-sm" data-testid="dialog-create-invoice">
            <DialogHeader>
              <DialogTitle>Create Stripe Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="invoice-email">
                  Customer Email
                </label>
                <Input
                  id="invoice-email"
                  type="email"
                  placeholder="client@example.com"
                  value={invoiceEmail}
                  onChange={(e) => setInvoiceEmail(e.target.value)}
                  data-testid="input-invoice-email"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setInvoiceDialogOpen(false)}
                  data-testid="button-cancel-invoice"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createInvoiceMutation.mutate()}
                  disabled={!invoiceEmail.trim() || createInvoiceMutation.isPending}
                  data-testid="button-submit-invoice"
                >
                  {createInvoiceMutation.isPending ? (
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
      </DialogContent>
    </Dialog>
  );
}

// ── Loading Skeleton ─────────────────────────────────

function ContractsTableSkeleton() {
  return (
    <Card className="glass-card" data-testid="skeleton-contracts-table">
      <CardContent className="p-0">
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────

export default function Contracts() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: contracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Stripe integration status
  useQuery({
    queryKey: ["/api/stripe/status"],
  });

  const isLoading = contractsLoading || clientsLoading;

  // Build client name lookup
  const clientMap: Record<string, string> = {};
  if (clients) {
    for (const c of clients) {
      clientMap[c.id] = c.businessName;
    }
  }

  // Filter contracts
  const filtered = (contracts ?? []).filter((c) => {
    const clientName = clientMap[c.clientId] || "";
    const matchesSearch =
      !search ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceDescription.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleRowClick(contract: Contract) {
    navigate(`/contracts/${contract.id}`);
  }

  // Summary stats
  const allContracts = contracts ?? [];
  const activeCount = allContracts.filter((c) => c.status === "active" || c.status === "signed").length;
  const totalMonthly = allContracts
    .filter((c) => c.status === "active" || c.status === "signed")
    .reduce((sum, c) => sum + (c.monthlyValue ?? 0), 0);
  const draftCount = allContracts.filter((c) => c.status === "draft").length;

  return (
    <div className="flex-1 overflow-auto" data-testid="page-contracts">
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">Contracts</h1>
            <p className="text-sm text-muted-foreground">Manage client agreements</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" data-testid="button-create-contract">
            <Plus className="h-4 w-4 mr-1.5" />
            New Contract
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="section-summary">
            <Card className="p-4 glass-card" data-testid="card-active-contracts">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Contracts</div>
              <div className="text-2xl font-semibold mt-1" data-testid="text-active-count">{activeCount}</div>
            </Card>
            <Card className="p-4 glass-card" data-testid="card-monthly-revenue">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Revenue</div>
              <div className="text-2xl font-semibold mt-1" data-testid="text-monthly-revenue">{formatAUD(totalMonthly)}</div>
            </Card>
            <Card className="p-4 glass-card" data-testid="card-draft-contracts">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Drafts</div>
              <div className="text-2xl font-semibold mt-1" data-testid="text-draft-count">{draftCount}</div>
            </Card>
          </div>
        )}

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3" data-testid="filter-row">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-contracts"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contracts Table */}
        {isLoading ? (
          <ContractsTableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state-contracts">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium text-muted-foreground">
              {allContracts.length > 0 ? "No contracts match your filters" : "No contracts yet"}
            </h3>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {allContracts.length > 0
                ? "Try adjusting your search or status filter."
                : "Create your first contract to get started."}
            </p>
            {allContracts.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setCreateOpen(true)}
                data-testid="button-create-contract-empty"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New Contract
              </Button>
            )}
          </div>
        ) : (
          <Card className="glass-card" data-testid="section-contracts-table">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Monthly Value</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Signatures</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((contract) => (
                    <TableRow
                      key={contract.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(contract)}
                      data-testid={`row-contract-${contract.id}`}
                    >
                      <TableCell>
                        <span className="font-medium" data-testid={`text-contract-client-${contract.id}`}>
                          {clientMap[contract.clientId] || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm text-muted-foreground max-w-[200px] truncate block"
                          data-testid={`text-contract-service-${contract.id}`}
                        >
                          {contract.serviceDescription}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium" data-testid={`text-contract-value-${contract.id}`}>
                          {formatAUD(contract.monthlyValue)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground" data-testid={`text-contract-start-${contract.id}`}>
                          {formatDate(contract.startDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground" data-testid={`text-contract-end-${contract.id}`}>
                          {formatDate(contract.endDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground" data-testid={`text-contract-gst-${contract.id}`}>
                          {contract.gstHandling === "inclusive"
                            ? "Incl."
                            : contract.gstHandling === "exclusive"
                              ? "Excl."
                              : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" data-testid={`sig-status-${contract.id}`}>
                          <div
                            className={`h-2 w-2 rounded-full ${contract.agencySignature ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
                            title={contract.agencySignature ? "Agency signed" : "Agency pending"}
                          />
                          <div
                            className={`h-2 w-2 rounded-full ${contract.clientSignature ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
                            title={contract.clientSignature ? "Client signed" : "Client pending"}
                          />
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {contract.agencySignature && contract.clientSignature
                              ? "Both"
                              : contract.agencySignature
                                ? "Agency"
                                : contract.clientSignature
                                  ? "Client"
                                  : "None"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={STATUS_STYLES[contract.status] || ""}
                          data-testid={`badge-contract-status-${contract.id}`}
                        >
                          {statusLabel(contract.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <CreateContractDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients ?? []}
      />
    </div>
  );
}
