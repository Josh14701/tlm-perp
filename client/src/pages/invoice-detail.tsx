import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  ExternalLink,
  Pencil,
  Check,
  Save,
  Loader2,
} from "lucide-react";
import type { Client, InvoiceDraft } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import tlmLogo from "@/assets/tlm-logo.png";

/* ─── Types ───────────────────────────────────────── */

interface StripeLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: string;
}

interface StripeInvoiceDetail {
  id: string;
  number: string | null;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  description: string | null;
  footer: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
  lineItems: StripeLineItem[];
  dueDate: string | null;
  created: string;
  periodStart: string | null;
  periodEnd: string | null;
  invoiceUrl: string | null;
  invoicePdf: string | null;
  customFields: Array<{ name: string; value: string }>;
  metadata: Record<string, string>;
}

type EditableLineItem = {
  description: string;
  quantity: number;
  unitAmount: number;
  serviceNotes: string; // bullet-point services e.g. "- Videography\n- Content Creation"
};

/* ─── Helpers ─────────────────────────────────────── */

function formatCurrency(value: number, currency = "aud"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toInputDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-500/15 text-amber-700 border-amber-500/25",
  open: "bg-blue-500/15 text-blue-700 border-blue-500/25",
  paid: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
  synced: "bg-sky-500/15 text-sky-700 border-sky-500/25",
  sent: "bg-indigo-500/15 text-indigo-700 border-indigo-500/25",
  uncollectible: "bg-red-500/15 text-red-700 border-red-500/25",
  void: "bg-slate-500/15 text-slate-700 border-slate-500/25",
};

/* ─── Editable field component ────────────────────── */

function EditableField({
  value,
  onChange,
  editing,
  className = "",
  inputClassName = "",
  placeholder = "",
  multiline = false,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  if (!editing) {
    if (!value) return null;
    if (multiline) {
      return (
        <div className={className}>
          {value.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      );
    }
    return <span className={className}>{value}</span>;
  }

  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-amber-50/80 border-amber-200/60 focus:border-amber-400 text-slate-900 ${inputClassName}`}
        placeholder={placeholder}
        rows={3}
      />
    );
  }

  return (
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-amber-50/80 border-amber-200/60 focus:border-amber-400 h-auto py-1 px-2 text-slate-900 ${inputClassName}`}
      placeholder={placeholder}
    />
  );
}

/* ─── Component ───────────────────────────────────── */

export default function InvoiceDetail({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Determine source
  const isStripe = params.id.startsWith("in_");

  const { data: stripeInvoice, isLoading: stripeLoading } =
    useQuery<StripeInvoiceDetail>({
      queryKey: [`/api/stripe/invoices/${params.id}`],
      enabled: isStripe,
    });

  const { data: localDraft, isLoading: draftLoading } =
    useQuery<InvoiceDraft>({
      queryKey: [`/api/invoice-drafts/${params.id}`],
      enabled: !isStripe,
    });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const isLoading = isStripe ? stripeLoading : draftLoading;

  // ── All editable state ──
  const [editing, setEditing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // From (sender)
  const [fromName, setFromName] = useState("ThirdLink Media");
  const [fromAddress, setFromAddress] = useState("58 Shropshire St\nSydney New South Wales\n2168 Australia");
  const [fromPhone, setFromPhone] = useState("+61 479 141 513");
  const [fromEmail, setFromEmail] = useState("joshuaakerry@thirdlinkmedia.com");
  const [fromAbn, setFromAbn] = useState("");

  // Invoice meta
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [dateDue, setDateDue] = useState("");

  // Bill To (recipient)
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToEmail, setBillToEmail] = useState("");

  // Line items — fully editable
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);

  // Notes / services
  const [customNotes, setCustomNotes] = useState("");
  const [servicesInclude, setServicesInclude] = useState("");

  // Status / currency
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("aud");

  // Stripe-only data
  const [amountDue, setAmountDue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [stripeTotal, setStripeTotal] = useState(0);

  const { toast } = useToast();

  // Save mutation for local drafts
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!localDraft) throw new Error("No draft to save");
      const payload = {
        title: lineItems[0]?.description || "Invoice",
        recipientName: billToName,
        recipientEmail: billToEmail || null,
        billingCompany: fromName || null,
        billingAbn: fromAbn || null,
        notes: customNotes || null,
        currency,
        lineItems: lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitAmount: li.unitAmount,
        })),
      };
      const res = await apiRequest("PATCH", `/api/invoice-drafts/${params.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoice-drafts/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-drafts"] });
      toast({ title: "Invoice saved", description: "Your changes have been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  function handleSave() {
    if (!isStripe && localDraft) {
      saveMutation.mutate();
    }
    setEditing(false);
  }

  // Initialize from loaded data
  useEffect(() => {
    if (initialized || isLoading) return;

    if (isStripe && stripeInvoice) {
      setInvoiceNumber(stripeInvoice.number || stripeInvoice.id);
      setDateOfIssue(toInputDate(stripeInvoice.created));
      setDateDue(toInputDate(stripeInvoice.dueDate));
      setBillToName(stripeInvoice.customerName || "");
      setBillToEmail(stripeInvoice.customerEmail || "");
      setStatus(stripeInvoice.status || "");
      setCurrency(stripeInvoice.currency || "aud");
      setAmountDue(stripeInvoice.amountDue);
      setAmountPaid(stripeInvoice.amountPaid);
      setStripeTotal(stripeInvoice.total);

      // Build bill-to address from Stripe customer address
      if (stripeInvoice.customerAddress) {
        const a = stripeInvoice.customerAddress;
        const parts = [
          a.line1,
          a.line2,
          [a.city, a.state, a.postal_code].filter(Boolean).join(" "),
          a.country,
        ].filter(Boolean);
        setBillToAddress(parts.join("\n"));
      }

      // Custom fields
      const cf = stripeInvoice.customFields ?? [];
      const abn = cf.find((f) => f.name === "ABN");
      if (abn) setFromAbn(abn.value);

      // Line items
      setLineItems(
        stripeInvoice.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitAmount: li.unitAmount,
          serviceNotes: "",
        }))
      );

      if (stripeInvoice.footer) setCustomNotes(stripeInvoice.footer);
      if (stripeInvoice.description) {
        // Use description as a starting point for services
      }
    }

    if (!isStripe && localDraft) {
      setInvoiceNumber(`DRAFT-${params.id.slice(0, 8).toUpperCase()}`);
      setDateOfIssue(toInputDate(localDraft.createdAt as string));
      setDateDue(toInputDate(localDraft.createdAt as string));
      setBillToName(localDraft.recipientName || "");
      setBillToEmail(localDraft.recipientEmail || "");
      setFromName(localDraft.billingCompany || "ThirdLink Media");
      setFromAbn(localDraft.billingAbn || "");
      setStatus(localDraft.status || "draft");
      setCurrency(localDraft.currency || "aud");
      setCustomNotes(localDraft.notes || "");

      const items = (localDraft.lineItems as Array<{ description: string; quantity: number; unitAmount: number }>) ?? [];
      setLineItems(
        items.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitAmount: li.unitAmount,
          serviceNotes: "",
        }))
      );

      // Look up client for bill-to address
      const client = clients?.find((c) => c.id === localDraft.clientId);
      if (client) {
        if (!localDraft.recipientName) setBillToName(client.businessName);
      }
    }

    setInitialized(true);
  }, [initialized, isLoading, isStripe, stripeInvoice, localDraft, clients, params.id]);

  // Computed totals
  const subtotal = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitAmount,
    0
  );
  const total = subtotal;

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitAmount: 0, serviceNotes: "" },
    ]);
  }

  function updateLineItem(index: number, patch: Partial<EditableLineItem>) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handlePrint() {
    window.print();
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 glass-header px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Skeleton className="h-[800px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if ((isStripe && !stripeInvoice) || (!isStripe && !localDraft)) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 glass-header px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Invoice not found</h1>
          </div>
        </header>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="flex-1 overflow-auto" data-testid="page-invoice-detail">
      {/* Screen-only header */}
      <header className="sticky top-0 z-10 glass-header px-6 py-4 print:hidden">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">
              Invoice {invoiceNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {billToName} &middot; {formatCurrency(total, currency)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing && !isStripe && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" />Save Changes</>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editing) {
                  handleSave();
                } else {
                  setEditing(true);
                }
              }}
            >
              {editing ? (
                <><Check className="h-4 w-4 mr-1.5" />Done Editing</>
              ) : (
                <><Pencil className="h-4 w-4 mr-1.5" />Edit Invoice</>
              )}
            </Button>
            {isStripe && stripeInvoice?.invoiceUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(stripeInvoice.invoiceUrl!, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Stripe
              </Button>
            )}
            <Button size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print / PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Invoice Document */}
      <div className="mx-auto max-w-4xl px-4 py-8 print:p-0 print:max-w-none">
        <div
          ref={invoiceRef}
          className="bg-white text-slate-900 rounded-2xl shadow-xl print:shadow-none print:rounded-none overflow-hidden"
          id="invoice-document"
        >
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />

          <div className="p-10 print:p-12">

            {/* ════════════════════════════════════════════════
                HEADER: Invoice title + Number + Status
               ════════════════════════════════════════════════ */}
            {/* Row 1: Invoice title + Logo */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Invoice
                </h1>
              </div>
              <img
                src={tlmLogo}
                alt="TLM"
                className="h-14 w-auto"
              />
            </div>

            {/* Row 2: Invoice meta */}
            <div className="flex items-start gap-6 mb-8 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                  Invoice number
                </p>
                {editing ? (
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm font-mono text-slate-900 w-48"
                    placeholder="INV-001"
                  />
                ) : (
                  <p className="font-mono font-medium text-slate-700">
                    {invoiceNumber}
                  </p>
                )}
              </div>
              {status && (
                <Badge
                  variant="outline"
                  className={`mt-4 ${STATUS_COLORS[status] ?? ""} print:border-slate-300 print:bg-transparent print:text-slate-700`}
                >
                  {status.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* ════════════════════════════════════════════════
                META: Dates row
               ════════════════════════════════════════════════ */}
            <div className="flex gap-8 mb-8 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Date of issue
                </p>
                {editing ? (
                  <Input
                    type="date"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                    className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-900 w-40"
                  />
                ) : (
                  <p className="font-medium text-slate-700">
                    {dateOfIssue ? formatDate(dateOfIssue) : "—"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Date due
                </p>
                {editing ? (
                  <Input
                    type="date"
                    value={dateDue}
                    onChange={(e) => setDateDue(e.target.value)}
                    className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-900 w-40"
                  />
                ) : (
                  <p className="font-medium text-slate-700">
                    {dateDue ? formatDate(dateDue) : "—"}
                  </p>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                FROM + BILL TO — side by side
               ════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 gap-12 mb-10 pb-8 border-b border-slate-200">
              {/* FROM */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  From
                </p>
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm font-semibold text-slate-900"
                      placeholder="Business name"
                    />
                    <Textarea
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 text-sm text-slate-600"
                      placeholder="Street address&#10;City State Postcode&#10;Country"
                      rows={3}
                    />
                    <Input
                      value={fromPhone}
                      onChange={(e) => setFromPhone(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-600"
                      placeholder="Phone number"
                    />
                    <Input
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-600"
                      placeholder="Email address"
                    />
                    <Input
                      value={fromAbn}
                      onChange={(e) => setFromAbn(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-600"
                      placeholder="ABN (optional)"
                    />
                  </div>
                ) : (
                  <div className="text-sm space-y-0.5">
                    <p className="font-semibold text-slate-900">{fromName}</p>
                    {fromAddress && (
                      <div className="text-slate-500">
                        {fromAddress.split("\n").map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    )}
                    {fromPhone && <p className="text-slate-500">{fromPhone}</p>}
                    {fromEmail && <p className="text-slate-500">{fromEmail}</p>}
                    {fromAbn && <p className="text-slate-500">ABN: {fromAbn}</p>}
                  </div>
                )}
              </div>

              {/* BILL TO */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Bill to
                </p>
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={billToName}
                      onChange={(e) => setBillToName(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm font-semibold text-slate-900"
                      placeholder="Client / Company name"
                    />
                    <Textarea
                      value={billToAddress}
                      onChange={(e) => setBillToAddress(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 text-sm text-slate-600"
                      placeholder="Street address&#10;City State Postcode&#10;Country"
                      rows={3}
                    />
                    <Input
                      value={billToEmail}
                      onChange={(e) => setBillToEmail(e.target.value)}
                      className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-600"
                      placeholder="Client email"
                    />
                  </div>
                ) : (
                  <div className="text-sm space-y-0.5">
                    <p className="font-semibold text-slate-900">{billToName || "—"}</p>
                    {billToAddress && (
                      <div className="text-slate-500">
                        {billToAddress.split("\n").map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    )}
                    {billToEmail && <p className="text-slate-500">{billToEmail}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                AMOUNT DUE banner
               ════════════════════════════════════════════════ */}
            <div className="mb-8">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(total, currency)} due {dateDue ? formatDate(dateDue) : ""}
              </p>
            </div>

            {/* ════════════════════════════════════════════════
                LINE ITEMS TABLE
               ════════════════════════════════════════════════ */}
            <div className="mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="text-left py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Description
                    </th>
                    <th className="text-center py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 w-16">
                      Qty
                    </th>
                    <th className="text-right py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 w-32">
                      Unit price
                    </th>
                    <th className="text-right py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 w-32">
                      Amount
                    </th>
                    {editing && (
                      <th className="w-10 print:hidden" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={index} className="border-b border-slate-200 align-top">
                      {editing ? (
                        <>
                          <td className="py-3 pr-3">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(index, { description: e.target.value })
                              }
                              className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-slate-900 mb-1"
                              placeholder="Line item description"
                            />
                            <Textarea
                              value={item.serviceNotes}
                              onChange={(e) =>
                                updateLineItem(index, { serviceNotes: e.target.value })
                              }
                              className="bg-amber-50/80 border-amber-200/60 text-xs text-slate-500 mt-1"
                              placeholder="Services include:&#10;- Service 1&#10;- Service 2"
                              rows={2}
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              min="1"
                              value={String(item.quantity)}
                              onChange={(e) =>
                                updateLineItem(index, { quantity: Number(e.target.value) || 1 })
                              }
                              className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-1 text-sm text-center text-slate-900 w-14 mx-auto"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={String(item.unitAmount)}
                              onChange={(e) =>
                                updateLineItem(index, { unitAmount: Number(e.target.value) || 0 })
                              }
                              className="bg-amber-50/80 border-amber-200/60 h-auto py-1 px-2 text-sm text-right text-slate-900 w-28 ml-auto"
                            />
                          </td>
                          <td className="py-3 text-right font-medium text-slate-800 text-sm">
                            {formatCurrency(item.quantity * item.unitAmount, currency)}
                          </td>
                          <td className="py-3 pl-2 print:hidden">
                            <button
                              onClick={() => removeLineItem(index)}
                              className="text-rose-400 hover:text-rose-600 mt-1"
                              title="Remove line item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 text-slate-700">
                            <p>{item.description || "—"}</p>
                            {item.serviceNotes && (
                              <div className="mt-1.5 text-xs text-slate-400 space-y-0.5">
                                {item.serviceNotes.split("\n").map((line, li) => (
                                  <p key={li}>{line}</p>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="py-3 text-right text-slate-600">
                            {formatCurrency(item.unitAmount, currency)}
                          </td>
                          <td className="py-3 text-right font-medium text-slate-800">
                            {formatCurrency(item.quantity * item.unitAmount, currency)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {editing && (
                <button
                  onClick={addLineItem}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 print:hidden"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add line item
                </button>
              )}
            </div>

            {/* ════════════════════════════════════════════════
                TOTALS
               ════════════════════════════════════════════════ */}
            <div className="flex justify-end mb-8">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                  <span>Amount due</span>
                  <span className="text-orange-600">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════
                SERVICES INCLUDED (optional section)
               ════════════════════════════════════════════════ */}
            {(editing || servicesInclude) && (
              <div className="mb-8 pb-8 border-b border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Services include
                </p>
                {editing ? (
                  <Textarea
                    value={servicesInclude}
                    onChange={(e) => setServicesInclude(e.target.value)}
                    className="bg-amber-50/80 border-amber-200/60 text-sm text-slate-700"
                    placeholder="- Videography&#10;- Content Creation&#10;- Landing Pages&#10;- Media Buying"
                    rows={4}
                  />
                ) : (
                  <div className="text-sm text-slate-600 space-y-0.5">
                    {servicesInclude.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════
                NOTES / PAYMENT INSTRUCTIONS
               ════════════════════════════════════════════════ */}
            {(editing || customNotes) && (
              <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Notes / Payment instructions
                </p>
                {editing ? (
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    className="bg-amber-50/80 border-amber-200/60 text-sm text-slate-700"
                    placeholder="Bank details, payment instructions, thank you message..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {customNotes}
                  </p>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════
                FOOTER
               ════════════════════════════════════════════════ */}
            <div className="border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-400">
                {fromName} &middot; Powered by TLM Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
