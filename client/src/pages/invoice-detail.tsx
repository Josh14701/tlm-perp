import { useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  Plus,
  Trash2,
  Printer,
  ExternalLink,
  Pencil,
  Check,
} from "lucide-react";
import type { Client, InvoiceDraft } from "@shared/schema";

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

type LocalLineItem = {
  description: string;
  quantity: number;
  unitAmount: number;
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
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

/* ─── Component ───────────────────────────────────── */

export default function InvoiceDetail({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Determine if this is a Stripe invoice (starts with "in_") or a local draft
  const isStripe = params.id.startsWith("in_");

  // Fetch Stripe invoice detail
  const { data: stripeInvoice, isLoading: stripeLoading } =
    useQuery<StripeInvoiceDetail>({
      queryKey: [`/api/stripe/invoices/${params.id}`],
      enabled: isStripe,
    });

  // Fetch local draft
  const { data: localDraft, isLoading: draftLoading } =
    useQuery<InvoiceDraft>({
      queryKey: [`/api/invoice-drafts/${params.id}`],
      enabled: !isStripe,
    });

  // Fetch clients for branding info
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const isLoading = isStripe ? stripeLoading : draftLoading;

  // ── Editable overlay state ──
  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState("TLM Engine");
  const [companyTagline, setCompanyTagline] = useState("Digital Agency");
  const [companyAddress, setCompanyAddress] = useState(
    "Australia"
  );
  const [companyAbn, setCompanyAbn] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [extraLineItems, setExtraLineItems] = useState<LocalLineItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize editable state from data once loaded
  if (!initialized && !isLoading) {
    if (!isStripe && localDraft) {
      setCompanyName(localDraft.billingCompany || "TLM Engine");
      setCompanyAbn(localDraft.billingAbn || "");
      setCustomNotes(localDraft.notes || "");
    }
    if (isStripe && stripeInvoice) {
      const cf = stripeInvoice.customFields;
      const billingEntity = cf?.find((f) => f.name === "Billing Entity");
      const abn = cf?.find((f) => f.name === "ABN");
      if (billingEntity) setCompanyName(billingEntity.value);
      if (abn) setCompanyAbn(abn.value);
      if (stripeInvoice.footer) setCustomNotes(stripeInvoice.footer);
    }
    setInitialized(true);
  }

  // Build unified line items
  const baseLineItems: LocalLineItem[] = useMemo(() => {
    if (isStripe && stripeInvoice) {
      return stripeInvoice.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitAmount: li.unitAmount,
      }));
    }
    if (!isStripe && localDraft) {
      return (localDraft.lineItems as LocalLineItem[] | null) ?? [];
    }
    return [];
  }, [isStripe, stripeInvoice, localDraft]);

  const allLineItems = [...baseLineItems, ...extraLineItems];
  const subtotal = allLineItems.reduce(
    (sum, li) => sum + li.quantity * li.unitAmount,
    0
  );
  const tax = isStripe && stripeInvoice ? stripeInvoice.tax : 0;
  const total = subtotal + tax;
  const currency =
    (isStripe ? stripeInvoice?.currency : localDraft?.currency) || "aud";

  // Customer info
  const customerName = isStripe
    ? stripeInvoice?.customerName
    : localDraft?.recipientName;
  const customerEmail = isStripe
    ? stripeInvoice?.customerEmail
    : localDraft?.recipientEmail;
  const customerAddress = isStripe ? stripeInvoice?.customerAddress : null;

  const invoiceNumber = isStripe
    ? stripeInvoice?.number
    : `DRAFT-${params.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = isStripe ? stripeInvoice?.created : localDraft?.createdAt;
  const dueDate = isStripe
    ? stripeInvoice?.dueDate
    : localDraft?.createdAt; // drafts don't have explicit due dates stored as dates
  const status = isStripe ? stripeInvoice?.status : localDraft?.status;

  // Client lookup for logo/branding
  const clientId = !isStripe
    ? localDraft?.clientId
    : stripeInvoice?.metadata?.tlm_client_id;
  const client = clients?.find((c) => c.id === clientId);

  function addExtraLineItem() {
    setExtraLineItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitAmount: 0 },
    ]);
  }

  function updateExtraLineItem(index: number, patch: Partial<LocalLineItem>) {
    setExtraLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeExtraLineItem(index: number) {
    setExtraLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePrint() {
    window.print();
  }

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

  if ((isStripe && !stripeInvoice) || (!isStripe && !localDraft)) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 glass-header px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/invoices")}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Invoice not found</h1>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="page-invoice-detail">
      {/* ── Screen-only header ── */}
      <header className="sticky top-0 z-10 glass-header px-6 py-4 print:hidden">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/invoices")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">
              Invoice {invoiceNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {customerName} &middot; {formatCurrency(total, currency)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Done Editing
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Customise
                </>
              )}
            </Button>
            {isStripe && stripeInvoice?.invoiceUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(stripeInvoice.invoiceUrl!, "_blank")
                }
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

      {/* ── Invoice Document ── */}
      <div className="mx-auto max-w-4xl px-4 py-8 print:p-0 print:max-w-none">
        <div
          ref={invoiceRef}
          className="bg-white text-slate-900 rounded-2xl shadow-xl print:shadow-none print:rounded-none overflow-hidden"
          id="invoice-document"
        >
          {/* Top accent bar */}
          <div className="h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 print:from-orange-500 print:via-amber-500 print:to-yellow-500" />

          <div className="p-10 print:p-12 space-y-8">
            {/* ── Header: Company + Invoice meta ── */}
            <div className="flex justify-between items-start gap-8">
              <div className="space-y-1">
                {editing ? (
                  <div className="space-y-2">
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="text-2xl font-bold h-auto py-1 px-2 bg-amber-50 border-amber-200"
                      placeholder="Company name"
                    />
                    <Input
                      value={companyTagline}
                      onChange={(e) => setCompanyTagline(e.target.value)}
                      className="text-sm h-auto py-1 px-2 bg-amber-50 border-amber-200"
                      placeholder="Tagline"
                    />
                    <Input
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="text-sm h-auto py-1 px-2 bg-amber-50 border-amber-200"
                      placeholder="Address"
                    />
                    <Input
                      value={companyAbn}
                      onChange={(e) => setCompanyAbn(e.target.value)}
                      className="text-sm h-auto py-1 px-2 bg-amber-50 border-amber-200"
                      placeholder="ABN"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                      {companyName}
                    </h2>
                    {companyTagline && (
                      <p className="text-sm text-slate-500">{companyTagline}</p>
                    )}
                    {companyAddress && (
                      <p className="text-sm text-slate-500">
                        {companyAddress}
                      </p>
                    )}
                    {companyAbn && (
                      <p className="text-sm text-slate-500">
                        ABN: {companyAbn}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="text-right space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
                  Invoice
                </h1>
                <p className="text-sm text-slate-500 font-mono">
                  {invoiceNumber}
                </p>
                {status && (
                  <Badge
                    variant="outline"
                    className={`${STATUS_COLORS[status] ?? ""} print:border-slate-300 print:bg-transparent print:text-slate-700`}
                  >
                    {status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>

            {/* ── Bill To + Dates ── */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Bill To
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {customerName ?? "—"}
                </p>
                {customerEmail && (
                  <p className="text-sm text-slate-500">{customerEmail}</p>
                )}
                {customerAddress && (
                  <div className="text-sm text-slate-500 mt-1">
                    {customerAddress.line1 && <p>{customerAddress.line1}</p>}
                    {customerAddress.line2 && <p>{customerAddress.line2}</p>}
                    <p>
                      {[
                        customerAddress.city,
                        customerAddress.state,
                        customerAddress.postal_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {customerAddress.country && (
                      <p>{customerAddress.country}</p>
                    )}
                  </div>
                )}
                {client?.businessName &&
                  client.businessName !== customerName && (
                    <p className="text-sm text-slate-500 mt-1">
                      c/o {client.businessName}
                    </p>
                  )}
              </div>

              <div className="text-right space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Invoice Date
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(invoiceDate as string)}
                  </p>
                </div>
                {dueDate && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Due Date
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {formatDate(dueDate as string)}
                    </p>
                  </div>
                )}
                {!isStripe && localDraft?.paymentTerms && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Payment Terms
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {localDraft.paymentTerms}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Description ── */}
            {(isStripe ? stripeInvoice?.description : localDraft?.title) && (
              <div className="bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Description
                </p>
                <p className="text-sm text-slate-700">
                  {isStripe ? stripeInvoice?.description : localDraft?.title}
                </p>
              </div>
            )}

            {/* ── Line Items Table ── */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Description
                    </th>
                    <th className="text-center py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 w-20">
                      Qty
                    </th>
                    <th className="text-right py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 w-32">
                      Unit Price
                    </th>
                    <th className="text-right py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 w-32">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {baseLineItems.map((item, index) => (
                    <tr
                      key={`base-${index}`}
                      className="border-b border-slate-100"
                    >
                      <td className="py-3 text-slate-700">
                        {item.description || "—"}
                      </td>
                      <td className="py-3 text-center text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        {formatCurrency(item.unitAmount, currency)}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-800">
                        {formatCurrency(
                          item.quantity * item.unitAmount,
                          currency
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Extra (user-added) line items */}
                  {extraLineItems.map((item, index) => (
                    <tr
                      key={`extra-${index}`}
                      className="border-b border-slate-100 bg-amber-50/50 print:bg-transparent"
                    >
                      {editing ? (
                        <>
                          <td className="py-2">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateExtraLineItem(index, {
                                  description: e.target.value,
                                })
                              }
                              className="h-8 text-sm bg-white border-amber-200"
                              placeholder="Description"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <Input
                              type="number"
                              min="1"
                              value={String(item.quantity)}
                              onChange={(e) =>
                                updateExtraLineItem(index, {
                                  quantity: Number(e.target.value) || 1,
                                })
                              }
                              className="h-8 text-sm text-center bg-white border-amber-200 w-16 mx-auto"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={String(item.unitAmount)}
                              onChange={(e) =>
                                updateExtraLineItem(index, {
                                  unitAmount: Number(e.target.value) || 0,
                                })
                              }
                              className="h-8 text-sm text-right bg-white border-amber-200 w-28 ml-auto"
                            />
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {formatCurrency(
                                  item.quantity * item.unitAmount,
                                  currency
                                )}
                              </span>
                              <button
                                onClick={() => removeExtraLineItem(index)}
                                className="text-rose-400 hover:text-rose-600 print:hidden"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 text-slate-700">
                            {item.description || "—"}
                          </td>
                          <td className="py-3 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="py-3 text-right text-slate-600">
                            {formatCurrency(item.unitAmount, currency)}
                          </td>
                          <td className="py-3 text-right font-medium text-slate-800">
                            {formatCurrency(
                              item.quantity * item.unitAmount,
                              currency
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add line item button (editing mode) */}
              {editing && (
                <button
                  onClick={addExtraLineItem}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 print:hidden"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add custom line item
                </button>
              )}
            </div>

            {/* ── Totals ── */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal, currency)}
                  </span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax</span>
                    <span className="font-medium">
                      {formatCurrency(tax, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 border-slate-900 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total, currency)}</span>
                </div>
                {isStripe &&
                  stripeInvoice &&
                  stripeInvoice.amountPaid > 0 &&
                  stripeInvoice.amountPaid < stripeInvoice.total && (
                    <>
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Amount Paid</span>
                        <span className="font-medium">
                          -{formatCurrency(stripeInvoice.amountPaid, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-slate-900">
                        <span>Amount Due</span>
                        <span>
                          {formatCurrency(stripeInvoice.amountDue, currency)}
                        </span>
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* ── Notes ── */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              {editing ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Notes / Payment Instructions
                  </p>
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={4}
                    className="text-sm bg-amber-50 border-amber-200"
                    placeholder="Add payment instructions, bank details, thank you message..."
                  />
                </div>
              ) : customNotes ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Notes
                  </p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {customNotes}
                  </p>
                </div>
              ) : null}

              {/* Custom fields from Stripe */}
              {isStripe &&
                stripeInvoice?.customFields &&
                stripeInvoice.customFields.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {stripeInvoice.customFields.map((field, i) => (
                      <div key={i}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {field.name}
                        </p>
                        <p className="text-sm text-slate-600">{field.value}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-slate-100 pt-6 text-center">
              <p className="text-xs text-slate-400">
                Generated by {companyName} &middot; Powered by TLM Engine
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
