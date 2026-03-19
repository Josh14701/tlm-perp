import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2,
  Layers,
  Grid2X2,
  Library,
  Loader2,
  Check,
  X,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import type { GeneratedImage, Client } from "@shared/schema";

// ── Status Styles ──────────────────────────────────

const IMAGE_STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  approved:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  rejected:
    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
};

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MODEL_OPTIONS = [
  { value: "dall-e-3", label: "DALL-E 3" },
  { value: "dall-e-2", label: "DALL-E 2" },
  { value: "nano_banana_2", label: "NanoBanana 2" },
  { value: "nano_banana_pro", label: "NanoBanana Pro" },
];

function resolveImageSrc(imageData: string | null | undefined): string | null {
  if (!imageData || imageData === "error" || imageData === "placeholder") return null;
  if (imageData.startsWith("http")) return imageData;
  if (imageData.startsWith("data:")) return imageData;
  return null;
}

// ── Shared Generation Controls ─────────────────────

function GenerationControls({
  model,
  setModel,
  styleNotes,
  setStyleNotes,
  clientId,
  setClientId,
  clients,
}: {
  model: string;
  setModel: (v: string) => void;
  styleNotes: string;
  setStyleNotes: (v: string) => void;
  clientId: string;
  setClientId: (v: string) => void;
  clients: Client[];
}) {
  return (
    <div className="space-y-3" data-testid="generation-controls">
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Model
        </label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger data-testid="select-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Style Notes
        </label>
        <Textarea
          placeholder="e.g. Minimalist, bright colors, flat design..."
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          rows={2}
          data-testid="textarea-style-notes"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Client
        </label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger data-testid="select-client">
            <SelectValue placeholder="No client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Client</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.businessName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ── Image Action Buttons ───────────────────────────

function ImageActions({
  imageId,
  onRegenerate,
  isRegenerating,
}: {
  imageId: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}) {
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/generated-images/${imageId}`, {
        status: "approved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({ title: "Image approved" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/generated-images/${imageId}`, {
        status: "rejected",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({ title: "Image skipped" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex gap-1.5" data-testid={`image-actions-${imageId}`}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => approveMutation.mutate()}
        disabled={approveMutation.isPending}
        className="text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
        data-testid={`button-approve-${imageId}`}
      >
        <Check className="h-3.5 w-3.5 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => rejectMutation.mutate()}
        disabled={rejectMutation.isPending}
        data-testid={`button-skip-${imageId}`}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Skip
      </Button>
      {onRegenerate && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={isRegenerating}
          data-testid={`button-regenerate-${imageId}`}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${isRegenerating ? "animate-spin" : ""}`}
          />
          Redo
        </Button>
      )}
    </div>
  );
}

// ── Generated Image Card ───────────────────────────

function GeneratedImageCard({
  image,
  showActions,
  onRegenerate,
  isRegenerating,
  onClick,
}: {
  image: GeneratedImage;
  showActions?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`overflow-hidden ${onClick ? "cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" : ""}`}
      data-testid={`card-image-${image.id}`}
    >
      <div className="relative aspect-square bg-muted" onClick={onClick}>
        {resolveImageSrc(image.imageData) ? (
          <img
            src={resolveImageSrc(image.imageData)!}
            alt={image.prompt}
            className="w-full h-full object-cover"
            data-testid={`img-generated-${image.id}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" data-testid={`img-placeholder-${image.id}`}>
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <Badge
          className={`absolute top-2 right-2 ${IMAGE_STATUS_STYLES[image.status ?? "pending"] || ""}`}
          variant="outline"
          data-testid={`badge-image-status-${image.id}`}
        >
          {statusLabel(image.status ?? "pending")}
        </Badge>
      </div>
      <CardContent className="p-3 space-y-2">
        <p
          className="text-xs text-muted-foreground line-clamp-2"
          data-testid={`text-image-prompt-${image.id}`}
        >
          {image.prompt}
        </p>
        <p className="text-xs text-muted-foreground/60">
          Model: {image.model}
        </p>
        {showActions && (
          <ImageActions
            imageId={image.id}
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ── Loading Skeleton ───────────────────────────────

function ImageSkeleton() {
  return (
    <Card className="overflow-hidden" data-testid="skeleton-image-card">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function GeneratingSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div
      className={`grid gap-4 ${count === 1 ? "grid-cols-1 max-w-md" : count === 4 ? "grid-cols-2 max-w-2xl" : `grid-cols-2 md:grid-cols-3 max-w-4xl`}`}
      data-testid="generating-skeleton"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="aspect-square bg-muted flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-muted-foreground/40 animate-spin" />
          </div>
          <CardContent className="p-3">
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Quick Mode ─────────────────────────────────────

function QuickMode({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("dall-e-3");
  const [styleNotes, setStyleNotes] = useState("");
  const [clientId, setClientId] = useState("none");
  const [result, setResult] = useState<GeneratedImage | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { prompt, model, styleNotes };
      if (clientId !== "none") payload.clientId = clientId;
      const res = await apiRequest("POST", "/api/ai/generate-image", payload);
      return (await res.json()) as GeneratedImage;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleRegenerate() {
    setResult(null);
    generateMutation.mutate();
  }

  return (
    <div className="space-y-6" data-testid="tab-quick-mode">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Prompt
            </label>
            <Textarea
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              data-testid="textarea-quick-prompt"
            />
          </div>
          <GenerationControls
            model={model}
            setModel={setModel}
            styleNotes={styleNotes}
            setStyleNotes={setStyleNotes}
            clientId={clientId}
            setClientId={setClientId}
            clients={clients}
          />
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!prompt.trim() || generateMutation.isPending}
            className="w-full"
            data-testid="button-generate-quick"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        <div className="lg:col-span-2">
          {generateMutation.isPending && !result ? (
            <GeneratingSkeleton count={1} />
          ) : result ? (
            <div className="max-w-md">
              <GeneratedImageCard
                image={result}
                showActions
                onRegenerate={handleRegenerate}
                isRegenerating={generateMutation.isPending}
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg"
              data-testid="empty-state-quick"
            >
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Enter a prompt and click generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Batch Mode ─────────────────────────────────────

function BatchMode({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [theme, setTheme] = useState("");
  const [count, setCount] = useState(4);
  const [model, setModel] = useState("dall-e-3");
  const [styleNotes, setStyleNotes] = useState("");
  const [clientId, setClientId] = useState("none");
  const [results, setResults] = useState<GeneratedImage[]>([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const promises = Array.from({ length: count }).map((_, i) => {
        const payload: Record<string, unknown> = {
          prompt: `${theme} — variation ${i + 1}`,
          model,
          styleNotes,
        };
        if (clientId !== "none") payload.clientId = clientId;
        return apiRequest("POST", "/api/ai/generate-image", payload).then(
          (res) => res.json() as Promise<GeneratedImage>,
        );
      });
      return Promise.all(promises);
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Batch generation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6" data-testid="tab-batch-mode">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Theme / Direction
            </label>
            <Textarea
              placeholder="Describe the theme for this batch..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              rows={4}
              data-testid="textarea-batch-theme"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Number of Images
            </label>
            <Select
              value={String(count)}
              onValueChange={(v) => setCount(Number(v))}
            >
              <SelectTrigger data-testid="select-batch-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} images
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <GenerationControls
            model={model}
            setModel={setModel}
            styleNotes={styleNotes}
            setStyleNotes={setStyleNotes}
            clientId={clientId}
            setClientId={setClientId}
            clients={clients}
          />
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!theme.trim() || generateMutation.isPending}
            className="w-full"
            data-testid="button-generate-batch"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating {count} images...
              </>
            ) : (
              <>
                <Layers className="h-4 w-4 mr-2" />
                Generate Batch
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {generateMutation.isPending && results.length === 0 ? (
            <GeneratingSkeleton count={count} />
          ) : results.length > 0 ? (
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              data-testid="grid-batch-results"
            >
              {results.map((img) => (
                <GeneratedImageCard
                  key={img.id}
                  image={img}
                  showActions
                />
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg"
              data-testid="empty-state-batch"
            >
              <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Set a theme and number of images to generate a batch
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Variations Mode ────────────────────────────────

function VariationsMode({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [concept, setConcept] = useState("");
  const [model, setModel] = useState("dall-e-3");
  const [styleNotes, setStyleNotes] = useState("");
  const [clientId, setClientId] = useState("none");
  const [results, setResults] = useState<GeneratedImage[]>([]);

  const labels = ["A", "B", "C", "D"];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const promises = labels.map((label) => {
        const payload: Record<string, unknown> = {
          prompt: `${concept} — Variation ${label}`,
          model,
          styleNotes,
        };
        if (clientId !== "none") payload.clientId = clientId;
        return apiRequest("POST", "/api/ai/generate-image", payload).then(
          (res) => res.json() as Promise<GeneratedImage>,
        );
      });
      return Promise.all(promises);
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6" data-testid="tab-variations-mode">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Concept
            </label>
            <Textarea
              placeholder="Describe the concept for 4 variations..."
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={4}
              data-testid="textarea-variations-concept"
            />
          </div>
          <GenerationControls
            model={model}
            setModel={setModel}
            styleNotes={styleNotes}
            setStyleNotes={setStyleNotes}
            clientId={clientId}
            setClientId={setClientId}
            clients={clients}
          />
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!concept.trim() || generateMutation.isPending}
            className="w-full"
            data-testid="button-generate-variations"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating 4 variations...
              </>
            ) : (
              <>
                <Grid2X2 className="h-4 w-4 mr-2" />
                Generate Variations
              </>
            )}
          </Button>
        </div>

        {/* 2x2 Grid */}
        <div className="lg:col-span-2">
          {generateMutation.isPending && results.length === 0 ? (
            <GeneratingSkeleton count={4} />
          ) : results.length > 0 ? (
            <div
              className="grid grid-cols-2 gap-4 max-w-2xl"
              data-testid="grid-variations-results"
            >
              {results.map((img, i) => (
                <div key={img.id} className="space-y-1">
                  <span
                    className="text-xs font-semibold text-muted-foreground"
                    data-testid={`text-variation-label-${i}`}
                  >
                    Variation {labels[i]}
                  </span>
                  <GeneratedImageCard
                    image={img}
                    showActions
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg"
              data-testid="empty-state-variations"
            >
              <Grid2X2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Enter a concept to generate 4 variations (A/B/C/D)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Library Tab ────────────────────────────────────

function LibraryTab() {
  const [page, setPage] = useState(1);
  const [viewImage, setViewImage] = useState<GeneratedImage | null>(null);
  const { toast } = useToast();
  const PER_PAGE = 12;

  const { data: allImages, isLoading } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/generated-images"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/generated-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      setViewImage(null);
      toast({ title: "Image deleted" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const images = allImages ?? [];
  const totalPages = Math.max(1, Math.ceil(images.length / PER_PAGE));
  const pageImages = images.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6" data-testid="tab-library">
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ImageSkeleton key={i} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-testid="empty-state-library"
        >
          <Library className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium text-muted-foreground">
            No generated images yet
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Generate images in Quick, Batch, or Variations mode.
          </p>
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            data-testid="grid-library"
          >
            {pageImages.map((img) => (
              <GeneratedImageCard
                key={img.id}
                image={img}
                onClick={() => setViewImage(img)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-2"
              data-testid="library-pagination"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span
                className="text-sm text-muted-foreground tabular-nums"
                data-testid="text-page-info"
              >
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Full-size View Dialog */}
      <Dialog
        open={!!viewImage}
        onOpenChange={(open) => !open && setViewImage(null)}
      >
        {viewImage && (
          <DialogContent
            className="max-w-3xl max-h-[90vh] overflow-y-auto"
            data-testid="dialog-image-view"
          >
            <DialogHeader>
              <DialogTitle data-testid="dialog-image-title">
                Generated Image
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {resolveImageSrc(viewImage.imageData) ? (
                <img
                  src={resolveImageSrc(viewImage.imageData)!}
                  alt={viewImage.prompt}
                  className="w-full rounded-lg"
                  data-testid="img-fullsize"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center bg-muted rounded-lg" data-testid="img-fullsize-placeholder">
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge
                  className={
                    IMAGE_STATUS_STYLES[viewImage.status ?? "pending"] || ""
                  }
                  variant="outline"
                  data-testid="badge-dialog-status"
                >
                  {statusLabel(viewImage.status ?? "pending")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Model: {viewImage.model}
                </span>
              </div>
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-dialog-prompt"
              >
                {viewImage.prompt}
              </p>
              {viewImage.styleNotes && (
                <p className="text-xs text-muted-foreground/60">
                  Style: {viewImage.styleNotes}
                </p>
              )}
              <div className="flex gap-2 pt-2 border-t">
                <ImageActions imageId={viewImage.id} />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(viewImage.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-image"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────

export default function ImageStudio() {
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  return (
    <div className="flex-1 overflow-auto" data-testid="page-image-studio">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <h1 className="text-lg font-semibold" data-testid="page-title">
          AI Image Studio
        </h1>
      </header>

      <div className="p-6">
        <Tabs defaultValue="quick" data-testid="image-studio-tabs">
          <TabsList className="mb-6" data-testid="tabs-list">
            <TabsTrigger value="quick" data-testid="tab-trigger-quick">
              <Wand2 className="h-4 w-4 mr-1.5" />
              Quick Mode
            </TabsTrigger>
            <TabsTrigger value="batch" data-testid="tab-trigger-batch">
              <Layers className="h-4 w-4 mr-1.5" />
              Batch Mode
            </TabsTrigger>
            <TabsTrigger
              value="variations"
              data-testid="tab-trigger-variations"
            >
              <Grid2X2 className="h-4 w-4 mr-1.5" />
              Variations
            </TabsTrigger>
            <TabsTrigger value="library" data-testid="tab-trigger-library">
              <Library className="h-4 w-4 mr-1.5" />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <QuickMode clients={clients ?? []} />
          </TabsContent>
          <TabsContent value="batch">
            <BatchMode clients={clients ?? []} />
          </TabsContent>
          <TabsContent value="variations">
            <VariationsMode clients={clients ?? []} />
          </TabsContent>
          <TabsContent value="library">
            <LibraryTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
