import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  PenLine,
  Copy,
  ExternalLink,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  Loader2,
  CreditCard,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Receipt,
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

// ── Signature Block ──────────────────────────────────

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
        {isSigned ? (
          <Badge
            variant="outline"
            className="ml-auto bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px]"
          >
            Signed
          </Badge>
        ) : (
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
            <img src={signature!} alt="Signature" className="h-12 object-contain" />
          ) : (
            <p className="font-serif italic text-xl text-gray-800 dark:text-gray-200">
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

// ── Main Page ────────────────────────────────────────

export default function ContractDetail({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientShareLink, setClientShareLink] = useState<string | null>(null);

  const { data: contract, isLoading: contractLoading } = useQuery<Contract>({
    queryKey: [`/api/contracts/${params.id}`],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const clientName = contract && clients
    ? clients.find((c) => c.id === contract.clientId)?.businessName ?? "Unknown"
    : "";

  const internalLink = `${window.location.origin}/#/contracts/${params.id}`;

  // Agency sign mutation
  const agencySignMutation = useMutation({
    mutationFn: async (agencySignature: string) => {
      const res = await apiRequest("PATCH", `/api/contracts/${params.id}/sign`, {
        agencySignature,
        agencySignerName: agencySignature,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Contract signed", description: "Agency signature has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Generate client share link
  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/share", {
        type: "contract",
        resourceId: params.id,
        clientId: contract?.clientId,
      });
      return res.json() as Promise<ShareLink>;
    },
    onSuccess: (data: ShareLink) => {
      const link = `${window.location.origin}/#/public/${data.token}`;
      setClientShareLink(link);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Client link created", description: "Shareable signing link generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Stripe checkout
  const stripeCheckoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/checkout", {
        contractId: params.id,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast({ title: "Stripe Checkout opened", description: "Redirecting to Stripe..." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
    },
  });

  // Status update
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PATCH", `/api/contracts/${params.id}`, { status: newStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({ title: "Status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Download as text
  function handleDownload() {
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

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  }

  if (contractLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 glass-header px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 glass-header px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate("/contracts")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-sm font-medium text-muted-foreground">Contract not found</h3>
        </div>
      </div>
    );
  }

  const bothSigned = !!(contract.agencySignature && contract.clientSignature);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Button variant="ghost" size="sm" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Contract — {clientName}</h1>
            </div>
            <Badge variant="outline" className={`rounded-full ${STATUS_STYLES[contract.status] || ""}`}>
              {statusLabel(contract.status)}
            </Badge>
          </div>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* ═══ LINKS SECTION ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Internal Link (Agency) */}
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Internal Link</h3>
                <p className="text-xs text-muted-foreground">For your team — view and manage this contract</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={internalLink}
                className="text-xs font-mono"
              />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(internalLink, "Internal link")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>

          {/* Client Shareable Link */}
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Client Link</h3>
                <p className="text-xs text-muted-foreground">Send to client — they can review and sign</p>
              </div>
            </div>
            {clientShareLink ? (
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={clientShareLink}
                  className="text-xs font-mono"
                />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(clientShareLink, "Client link")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(clientShareLink, "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => shareMutation.mutate()}
                disabled={shareMutation.isPending}
              >
                {shareMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-1.5" />
                )}
                {shareMutation.isPending ? "Generating..." : "Generate Client Link"}
              </Button>
            )}
          </Card>
        </div>

        <Separator />

        {/* ═══ SERVICE DESCRIPTION ═══ */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Service Description</h3>
          <div className="text-sm leading-relaxed whitespace-pre-line rounded-lg bg-muted/30 p-4 max-h-64 overflow-y-auto">
            {contract.serviceDescription}
          </div>
        </div>

        {/* ═══ FINANCIAL & DATES ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">Monthly Value</span>
            </div>
            <p className="text-2xl font-semibold">{formatAUD(contract.monthlyValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {contract.gstHandling === "inclusive"
                ? "GST Inclusive"
                : contract.gstHandling === "exclusive"
                  ? "GST Exclusive"
                  : "N/A"}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">Start Date</span>
            </div>
            <p className="text-lg font-medium">{formatDate(contract.startDate)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">End Date</span>
            </div>
            <p className="text-lg font-medium">{formatDate(contract.endDate)}</p>
          </Card>
        </div>

        {/* Payment Terms */}
        {contract.paymentTerms && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment Terms</h3>
            <p className="text-sm leading-relaxed">{contract.paymentTerms}</p>
          </div>
        )}

        <Separator />

        {/* ═══ SIGNATURES ═══ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Signatures</h3>
            {bothSigned && (
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 text-[10px]">
                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                Fully Executed
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* ═══ STRIPE PAYMENT ═══ */}
        {bothSigned && (
          <>
            <Separator />
            <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-6">
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
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                onClick={() => stripeCheckoutMutation.mutate()}
                disabled={stripeCheckoutMutation.isPending}
              >
                {stripeCheckoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                )}
                {stripeCheckoutMutation.isPending ? "Opening Stripe..." : `Setup ${formatAUD(contract.monthlyValue)}/mo Subscription`}
              </Button>
            </div>
          </>
        )}

        <Separator />

        {/* ═══ ACTIONS ═══ */}
        <div className="flex flex-wrap gap-2 pb-8">
          {contract.status === "signed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate("active")}
              disabled={statusMutation.isPending}
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
            >
              Cancel Contract
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
