import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Brain,
  FileText,
  ScrollText,
  BarChart3,
  Users,
  BookOpen,
  Target,
  Swords,
  Gift,
  TrendingUp,
  StickyNote,
  Shield,
  Globe,
  Loader2,
  Palette,
  Upload,
  Type,
} from "lucide-react";
import type { Client, KnowledgeBase, ContentPiece, Contract } from "@shared/schema";

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

function statusLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const KB_CATEGORIES = [
  { key: "brand", label: "Brand", icon: BookOpen },
  { key: "audience", label: "Audience", icon: Target },
  { key: "competitors", label: "Competitors", icon: Swords },
  { key: "offers", label: "Offers", icon: Gift },
  { key: "past_results", label: "Past Results", icon: TrendingUp },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "compliance", label: "Compliance", icon: Shield },
] as const;

// ── Edit Client Dialog ──────────────────────────────

const editClientSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  website: z.string().optional(),
  mrr: z.coerce.number().min(0).optional(),
  status: z.string(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  notes: z.string().optional(),
});

type EditClientValues = z.infer<typeof editClientSchema>;

function EditClientDialog({
  client,
  open,
  onOpenChange,
}: {
  client: Client;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<EditClientValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: {
      businessName: client.businessName,
      industry: client.industry ?? "",
      website: client.website ?? "",
      mrr: client.mrr ?? 0,
      status: client.status,
      contractStart: client.contractStart ?? "",
      contractEnd: client.contractEnd ?? "",
      notes: client.notes ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EditClientValues) => {
      const res = await apiRequest("PATCH", `/api/clients/${client.id}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onOpenChange(false);
      toast({ title: "Client updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-client">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-edit-client">Edit Client</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4" data-testid="form-edit-client">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-edit-business-name" />
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
                      <Input {...field} data-testid="input-edit-industry" />
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
                      <Input type="number" {...field} data-testid="input-edit-mrr" />
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
                    <Input {...field} data-testid="input-edit-website" />
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
                      <SelectTrigger data-testid="select-edit-status">
                        <SelectValue />
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
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" data-testid="input-edit-contract-start" />
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
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" data-testid="input-edit-contract-end" />
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
                    <Textarea rows={3} {...field} data-testid="input-edit-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit-client">
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-submit-edit-client">
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Knowledge Base Tab ──────────────────────────────

const kbEntrySchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type KBEntryValues = z.infer<typeof kbEntrySchema>;

function inferFallbackTypography(client: Client): string[] {
  const industry = client.industry?.toLowerCase() ?? "";

  if (industry.includes("law") || industry.includes("finance")) {
    return ["Primary style - Serif wordmark", "Supporting style - Classic editorial serif"];
  }

  if (industry.includes("beauty") || industry.includes("fashion") || industry.includes("lifestyle")) {
    return ["Primary style - Elegant high-contrast serif", "Supporting style - Clean modern sans serif"];
  }

  return ["Primary style - Modern sans serif", "Supporting style - Neutral grotesk sans serif"];
}

async function extractDominantColors(dataUri: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(["#64748B", "#CBD5E1", "#0F172A"]);
        return;
      }

      const sampleWidth = 120;
      const scale = Math.max(img.width, img.height) / sampleWidth || 1;
      canvas.width = Math.max(1, Math.round(img.width / scale));
      canvas.height = Math.max(1, Math.round(img.height / scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < imageData.length; i += 12) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 140) continue;

        const brightness = r + g + b;
        if (brightness > 735 || brightness < 45) continue;

        const qr = Math.round(r / 24) * 24;
        const qg = Math.round(g / 24) * 24;
        const qb = Math.round(b / 24) * 24;
        const hex = `#${qr.toString(16).padStart(2, "0")}${qg.toString(16).padStart(2, "0")}${qb.toString(16).padStart(2, "0")}`.toUpperCase();
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const palette = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([hex]) => hex)
        .slice(0, 6);

      resolve(palette.length > 0 ? palette : ["#64748B", "#CBD5E1", "#0F172A"]);
    };

    img.onerror = () => resolve(["#64748B", "#CBD5E1", "#0F172A"]);
    img.src = dataUri;
  });
}

function KnowledgeBaseTab({ clientId, client }: { clientId: string; client: Client }) {
  const { toast } = useToast();
  const [addCategory, setAddCategory] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<KnowledgeBase | null>(null);

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/firecrawl/scan", {
        url: client.website,
        clientId: client.id,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", { clientId }] });
      toast({ title: "Website scanned", description: `${data.entriesCreated} knowledge base entries created from ${client.website}` });
    },
    onError: (err: Error) => {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    },
  });

  const { data: entries, isLoading } = useQuery<KnowledgeBase[]>({
    queryKey: ["/api/knowledge-base", { clientId }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/knowledge-base?clientId=${clientId}`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: KBEntryValues) => {
      const res = await apiRequest("POST", "/api/knowledge-base", { ...values, clientId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", { clientId }] });
      setAddCategory(null);
      toast({ title: "Entry added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: KBEntryValues & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/knowledge-base/${id}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", { clientId }] });
      setEditEntry(null);
      toast({ title: "Entry updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base", { clientId }] });
      toast({ title: "Entry deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="kb-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const entriesByCategory = KB_CATEGORIES.map((cat) => ({
    ...cat,
    entries: (entries ?? []).filter((e) => e.category === cat.key),
  }));

  return (
    <div className="space-y-6" data-testid="tab-knowledge-base">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span>The AI brain for this client. Add everything the AI needs to know.</span>
        </div>
        {client.website && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => scanMutation.mutate()}
            disabled={scanMutation.isPending}
            data-testid="button-scan-website"
          >
            {scanMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Scanning website...
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                Scan Website
              </>
            )}
          </Button>
        )}
      </div>

      {entriesByCategory.map(({ key, label, icon: Icon, entries: catEntries }) => (
        <div key={key} data-testid={`kb-category-${key}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold" data-testid={`kb-category-title-${key}`}>{label}</h3>
              <Badge variant="secondary" className="text-xs" data-testid={`kb-category-count-${key}`}>
                {catEntries.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddCategory(key)}
              data-testid={`button-add-kb-${key}`}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>

          {catEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 pl-6 pb-2" data-testid={`kb-empty-${key}`}>
              No {label.toLowerCase()} entries yet.
            </p>
          ) : (
            <div className="space-y-2 pl-6">
              {catEntries.map((entry) => (
                <Card key={entry.id} className="bg-muted/30" data-testid={`kb-entry-${entry.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" data-testid={`kb-entry-title-${entry.id}`}>
                          {entry.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap" data-testid={`kb-entry-content-${entry.id}`}>
                          {entry.content}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditEntry(entry)}
                          data-testid={`button-edit-kb-${entry.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(entry.id)}
                          data-testid={`button-delete-kb-${entry.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add KB Entry Dialog */}
      <KBEntryDialog
        open={addCategory !== null}
        onOpenChange={(v) => { if (!v) setAddCategory(null); }}
        category={addCategory ?? "brand"}
        onSubmit={(values) => createMutation.mutate(values)}
        isPending={createMutation.isPending}
        title="Add Knowledge Base Entry"
      />

      {/* Edit KB Entry Dialog */}
      <KBEntryDialog
        open={editEntry !== null}
        onOpenChange={(v) => { if (!v) setEditEntry(null); }}
        category={editEntry?.category ?? "brand"}
        defaultValues={editEntry ? { title: editEntry.title, content: editEntry.content } : undefined}
        onSubmit={(values) => editEntry && updateMutation.mutate({ ...values, id: editEntry.id })}
        isPending={updateMutation.isPending}
        title="Edit Knowledge Base Entry"
      />
    </div>
  );
}

function KBEntryDialog({
  open,
  onOpenChange,
  category,
  defaultValues,
  onSubmit,
  isPending,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: string;
  defaultValues?: { title: string; content: string };
  onSubmit: (values: KBEntryValues) => void;
  isPending: boolean;
  title: string;
}) {
  const form = useForm<KBEntryValues>({
    resolver: zodResolver(kbEntrySchema),
    defaultValues: {
      category,
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
    },
    values: {
      category,
      title: defaultValues?.title ?? "",
      content: defaultValues?.content ?? "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-kb-entry">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-kb-entry">{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="form-kb-entry"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Entry title" {...field} data-testid="input-kb-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Details..." {...field} data-testid="input-kb-content" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-kb">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-kb">
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Brand Guidelines Tab ────────────────────────────

function BrandGuidelinesTab({ clientId, client }: { clientId: string; client: Client }) {
  const { toast } = useToast();
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const brandColors = (client as any).brandColors as string[] | null;
  const brandLogo = (client as any).brandLogo as string | null;
  const brandTypography = (client as any).brandTypography as string[] | null;
  const [draftColors, setDraftColors] = useState<string[]>(brandColors ?? []);
  const [draftTypography, setDraftTypography] = useState<string[]>(brandTypography ?? []);

  useEffect(() => {
    setDraftColors(brandColors ?? []);
    setDraftTypography(brandTypography ?? []);
  }, [clientId, brandColors, brandTypography]);

  const saveBrandMutation = useMutation({
    mutationFn: async (data: { brandLogo?: string | null; brandColors?: string[] | null; brandTypography?: string[] | null }) => {
      const res = await apiRequest("PATCH", `/api/clients/${clientId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId] });
      toast({ title: "Brand guidelines updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const analyzeBrandMutation = useMutation({
    mutationFn: async (data: { imageData: string }) => {
      const res = await apiRequest("POST", `/api/clients/${clientId}/analyze-brand-logo`, data);
      return res.json() as Promise<{
        brandColors?: string[];
        brandTypography?: string[];
        brandSummary?: string;
      }>;
    },
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;
      const fallbackColors = await extractDominantColors(dataUri);
      const fallbackTypography = inferFallbackTypography(client);

      try {
        const analysis = await analyzeBrandMutation.mutateAsync({ imageData: dataUri });
        setAnalysisSummary(analysis.brandSummary ?? null);
        const nextColors = analysis.brandColors?.length ? analysis.brandColors : fallbackColors;
        const nextTypography = analysis.brandTypography?.length ? analysis.brandTypography : fallbackTypography;
        setDraftColors(nextColors);
        setDraftTypography(nextTypography);

        await saveBrandMutation.mutateAsync({
          brandLogo: dataUri,
          brandColors: nextColors,
          brandTypography: nextTypography,
        });
      } catch (error: any) {
        setAnalysisSummary(null);
        setDraftColors(fallbackColors);
        setDraftTypography(fallbackTypography);
        await saveBrandMutation.mutateAsync({
          brandLogo: dataUri,
          brandColors: fallbackColors,
          brandTypography: fallbackTypography,
        });
        toast({
          title: "Saved with fallback analysis",
          description: "The logo was uploaded, but AI analysis was unavailable so a local palette was used.",
        });
      }
    };
    reader.readAsDataURL(file);
  }

  const normalizedOriginalColors = (brandColors ?? []).map((color) => color.trim().toUpperCase());
  const normalizedOriginalTypography = (brandTypography ?? []).map((font) => font.trim());
  const normalizedDraftColors = draftColors.map((color) => color.trim().toUpperCase()).filter(Boolean);
  const normalizedDraftTypography = draftTypography.map((font) => font.trim()).filter(Boolean);
  const hasManualChanges =
    JSON.stringify(normalizedDraftColors) !== JSON.stringify(normalizedOriginalColors) ||
    JSON.stringify(normalizedDraftTypography) !== JSON.stringify(normalizedOriginalTypography);

  async function saveManualBrandEdits() {
    await saveBrandMutation.mutateAsync({
      brandColors: normalizedDraftColors,
      brandTypography: normalizedDraftTypography,
    });
  }

  async function removeLogo() {
    setAnalysisSummary(null);
    await saveBrandMutation.mutateAsync({
      brandLogo: null,
      brandColors: normalizedDraftColors,
      brandTypography: normalizedDraftTypography,
    });
  }

  return (
    <div className="space-y-6" data-testid="tab-brand-guidelines">
      <Card className="glass-card">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="h-4 w-4 text-primary" />
              Brand intelligence
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Upload a clean logo file and we&apos;ll extract a usable palette and typography direction for the client profile and creative tools.
            </p>
            {analysisSummary && (
              <p className="text-sm text-muted-foreground">
                {analysisSummary}
              </p>
            )}
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              data-testid="input-logo-upload"
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                {brandLogo ? "Replace Logo" : "Upload Logo"}
              </span>
            </Button>
          </label>
        </CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 px-5 py-4 dark:border-white/8">
          <p className="text-xs text-muted-foreground">
            Adjust the AI suggestions before saving if you want tighter brand control.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasManualChanges || saveBrandMutation.isPending}
            onClick={() => saveManualBrandEdits()}
          >
            {saveBrandMutation.isPending ? "Saving..." : "Save Brand Edits"}
          </Button>
        </div>
      </Card>

      {/* Logo Section */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            Brand Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {brandLogo ? (
              <div className="flex h-36 w-36 items-center justify-center rounded-[24px] border border-white/45 bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:border-white/10 dark:bg-white/6">
                <img src={brandLogo} alt="Brand logo" className="max-w-full max-h-full object-contain" data-testid="img-brand-logo" />
              </div>
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-[24px] border-2 border-dashed border-white/50 bg-white/35 dark:border-white/10 dark:bg-white/6">
                <Upload className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Preferred upload: transparent PNG or SVG
              </p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                PNG, JPG, or SVG up to 5MB. The upload now runs through AI-assisted logo analysis, with a fallback palette if the model can&apos;t confidently read the artwork.
              </p>
              {(saveBrandMutation.isPending || analyzeBrandMutation.isPending) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing logo and saving brand guidelines...
                </div>
              )}
              {brandLogo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start px-0 text-rose-600 hover:text-rose-600 dark:text-rose-400"
                  onClick={() => removeLogo()}
                  disabled={saveBrandMutation.isPending}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete logo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draftColors.length > 0 ? (
            <div className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                {draftColors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-2" data-testid={`brand-color-${i}`}>
                    <div
                      className="h-16 w-16 rounded-2xl border border-white/50 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <Input
                      value={color}
                      onChange={(e) => {
                        const next = [...draftColors];
                        next[i] = e.target.value;
                        setDraftColors(next);
                      }}
                      className="h-9 w-32 text-center font-mono text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => setDraftColors(draftColors.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraftColors([...draftColors, "#94A3B8"])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Color
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground/60">
                No brand colors extracted yet. Upload a logo to auto-detect colors or add them manually.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraftColors(["#94A3B8"])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add First Color
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draftTypography.length > 0 ? (
            <div className="space-y-3">
              {draftTypography.map((font, i) => (
                <div key={i} className="rounded-2xl border border-white/35 bg-white/25 p-3 dark:border-white/8 dark:bg-white/5" data-testid={`brand-font-${i}`}>
                  <div className="flex items-start justify-between gap-3">
                    <Input
                      value={font}
                      onChange={(e) => {
                        const next = [...draftTypography];
                        next[i] = e.target.value;
                        setDraftTypography(next);
                      }}
                      className="h-10 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 px-3 text-xs text-muted-foreground"
                      onClick={() => setDraftTypography(draftTypography.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                  <span className="mt-3 block text-sm" style={{ fontFamily: font.toLowerCase().includes("serif") ? "Georgia, serif" : "system-ui, sans-serif" }}>
                    The quick brown fox jumps over the lazy dog
                  </span>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraftTypography([...draftTypography, "Primary style - Modern sans serif"])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Typography Note
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground/60">
                No typography detected yet. Upload a logo to get started or add your own brand type notes.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDraftTypography(["Primary style - Modern sans serif"])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Typography Note
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Content Tab ─────────────────────────────────────

function ContentTab({ clientId }: { clientId: string }) {
  const { data: pieces, isLoading } = useQuery<ContentPiece[]>({
    queryKey: ["/api/content-pieces", { clientId }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/content-pieces?clientId=${clientId}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="content-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!pieces || pieces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="content-empty">
        <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No content pieces yet for this client.</p>
      </div>
    );
  }

  const contentStatusStyles: Record<string, string> = {
    idea: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
    scripted: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    filmed: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
    edited: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    live: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
  };

  return (
    <div data-testid="tab-content">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="th-content-title">Title</TableHead>
            <TableHead data-testid="th-content-type">Type</TableHead>
            <TableHead data-testid="th-content-status">Status</TableHead>
            <TableHead data-testid="th-content-platforms">Platforms</TableHead>
            <TableHead data-testid="th-content-scheduled">Scheduled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pieces.map((piece) => (
            <TableRow key={piece.id} data-testid={`row-content-${piece.id}`}>
              <TableCell className="font-medium" data-testid={`text-content-title-${piece.id}`}>
                {piece.title}
              </TableCell>
              <TableCell data-testid={`text-content-type-${piece.id}`}>
                <span className="capitalize text-sm">{piece.type.replace("_", " ")}</span>
              </TableCell>
              <TableCell data-testid={`badge-content-status-${piece.id}`}>
                <Badge variant="outline" className={contentStatusStyles[piece.status] || ""}>
                  {statusLabel(piece.status)}
                </Badge>
              </TableCell>
              <TableCell data-testid={`text-content-platforms-${piece.id}`}>
                <div className="flex flex-wrap gap-1">
                  {(piece.platforms ?? []).map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px] px-1.5">
                      {p}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground" data-testid={`text-content-date-${piece.id}`}>
                {piece.scheduledDate || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Contracts Tab ───────────────────────────────────

function ContractsTab({ clientId }: { clientId: string }) {
  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts", { clientId }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/contracts?clientId=${clientId}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2" data-testid="contracts-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="contracts-empty">
        <ScrollText className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No contracts linked to this client.</p>
      </div>
    );
  }

  const contractStatusStyles: Record<string, string> = {
    draft: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25",
    sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    signed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    active: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
    expired: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    cancelled: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  };

  return (
    <div data-testid="tab-contracts">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="th-contract-service">Service</TableHead>
            <TableHead data-testid="th-contract-status">Status</TableHead>
            <TableHead data-testid="th-contract-value">Monthly Value</TableHead>
            <TableHead data-testid="th-contract-start">Start</TableHead>
            <TableHead data-testid="th-contract-end">End</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => (
            <TableRow key={c.id} data-testid={`row-contract-${c.id}`}>
              <TableCell className="font-medium" data-testid={`text-contract-service-${c.id}`}>
                {c.serviceDescription}
              </TableCell>
              <TableCell data-testid={`badge-contract-status-${c.id}`}>
                <Badge variant="outline" className={contractStatusStyles[c.status] || ""}>
                  {statusLabel(c.status)}
                </Badge>
              </TableCell>
              <TableCell data-testid={`text-contract-value-${c.id}`}>
                {formatAUD(c.monthlyValue)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground" data-testid={`text-contract-start-${c.id}`}>
                {c.startDate}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground" data-testid={`text-contract-end-${c.id}`}>
                {c.endDate || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Analytics Tab ───────────────────────────────────

interface AnalyticsSummary {
  totalFollowers?: number;
  totalImpressions?: number;
  avgEngagementRate?: number;
  totalReach?: number;
  totalLikes?: number;
  totalComments?: number;
  totalShares?: number;
  platforms?: string[];
}

function AnalyticsTab({ clientId }: { clientId: string }) {
  const { data: analytics, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics", clientId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/analytics/${clientId}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="analytics-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="analytics-empty">
        <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No analytics data available yet.</p>
      </div>
    );
  }

  const metrics = [
    { label: "Followers", value: analytics.totalFollowers?.toLocaleString() ?? "0" },
    { label: "Impressions", value: analytics.totalImpressions?.toLocaleString() ?? "0" },
    { label: "Avg. Engagement", value: analytics.avgEngagementRate != null ? `${analytics.avgEngagementRate.toFixed(2)}%` : "0%" },
    { label: "Total Reach", value: analytics.totalReach?.toLocaleString() ?? "0" },
    { label: "Likes", value: analytics.totalLikes?.toLocaleString() ?? "0" },
    { label: "Comments", value: analytics.totalComments?.toLocaleString() ?? "0" },
    { label: "Shares", value: analytics.totalShares?.toLocaleString() ?? "0" },
  ];

  return (
    <div data-testid="tab-analytics">
      {analytics.platforms && analytics.platforms.length > 0 && (
        <div className="flex gap-1.5 mb-4" data-testid="analytics-platforms">
          {analytics.platforms.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs capitalize">
              {p}
            </Badge>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} data-testid={`stat-${m.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-xl font-semibold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Team Tab ────────────────────────────────────────

function TeamTab({ client }: { client: Client }) {
  const team = client.assignedTeam ?? [];

  if (team.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="team-empty">
        <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No team members assigned to this client.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="tab-team">
      {team.map((member, idx) => (
        <Card key={idx} className="bg-muted/30" data-testid={`card-team-member-${idx}`}>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {member.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium" data-testid={`text-team-member-${idx}`}>{member}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Detail Page Skeleton ────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6" data-testid="client-detail-loading">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ── Main Page ───────────────────────────────────────

export default function ClientDetail({ params }: { params: { id: string } }) {
  const clientId = params.id;
  const [editOpen, setEditOpen] = useState(false);

  const { data: client, isLoading, isError } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
  });

  return (
    <div className="flex-1 overflow-auto" data-testid="page-client-detail">
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <Link href="/clients">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-clients">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          {client ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div>
                <h1 className="text-xl font-bold tracking-tight truncate" data-testid="text-client-name">
                  {client.businessName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formatAUD(client.mrr)}/mo
                </p>
              </div>
              <Badge
                variant="outline"
                className={`rounded-full ${STATUS_STYLES[client.status] || ""}`}
                data-testid="badge-client-status"
              >
                {statusLabel(client.status)}
              </Badge>
              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} data-testid="button-edit-client">
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            !isLoading && <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">Client Detail</h1>
          )}
        </div>
      </header>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !client ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="client-not-found">
          <p className="text-sm text-muted-foreground">Client not found.</p>
          <Link href="/clients">
            <Button variant="outline" size="sm" className="mt-4" data-testid="link-back-to-clients">
              Back to Clients
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mx-auto max-w-[1380px] space-y-6 px-4 py-5 md:px-6 md:py-8">
            <Tabs defaultValue="knowledge-base" data-testid="client-tabs">
              <TabsList className="mb-6 h-auto flex-wrap justify-start gap-2 rounded-[22px] p-1.5" data-testid="client-tabs-list">
                <TabsTrigger value="knowledge-base" data-testid="tab-trigger-kb">
                  <Brain className="h-3.5 w-3.5 mr-1.5" />
                  Knowledge Base
                </TabsTrigger>
                <TabsTrigger value="brand-guidelines" data-testid="tab-trigger-brand">
                  <Palette className="h-3.5 w-3.5 mr-1.5" />
                  Brand Guidelines
                </TabsTrigger>
                <TabsTrigger value="content" data-testid="tab-trigger-content">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="contracts" data-testid="tab-trigger-contracts">
                  <ScrollText className="h-3.5 w-3.5 mr-1.5" />
                  Contracts
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-trigger-analytics">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="team" data-testid="tab-trigger-team">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="knowledge-base" className="mt-0">
                <KnowledgeBaseTab clientId={clientId} client={client} />
              </TabsContent>
              <TabsContent value="brand-guidelines" className="mt-0">
                <BrandGuidelinesTab clientId={clientId} client={client} />
              </TabsContent>
              <TabsContent value="content" className="mt-0">
                <ContentTab clientId={clientId} />
              </TabsContent>
              <TabsContent value="contracts" className="mt-0">
                <ContractsTab clientId={clientId} />
              </TabsContent>
              <TabsContent value="analytics" className="mt-0">
                <AnalyticsTab clientId={clientId} />
              </TabsContent>
              <TabsContent value="team" className="mt-0">
                <TeamTab client={client} />
              </TabsContent>
            </Tabs>
          </div>

          <EditClientDialog client={client} open={editOpen} onOpenChange={setEditOpen} />
        </>
      )}
    </div>
  );
}
