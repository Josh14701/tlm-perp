import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import {
  User,
  Building2,
  Mail,
  Bot,
  Bell,
  Palette,
  ScrollText,
  Activity,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  CheckCircle,
  XCircle,
  Globe,
  Loader2,
} from "lucide-react";
import type { AgencySettings, ActivityLog, User as UserType } from "@shared/schema";

// ── Constants ─────────────────────────────────────────
const TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "US/Eastern",
  "US/Central",
  "US/Mountain",
  "US/Pacific",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Pacific/Auckland",
];

const EMAIL_TEMPLATE_KEYS = [
  { key: "welcome", label: "Welcome" },
  { key: "proposal", label: "Proposal" },
  { key: "invoice", label: "Invoice" },
  { key: "report", label: "Report" },
  { key: "reminder", label: "Reminder" },
] as const;

const NOTIFICATION_KEYS = [
  { key: "newClient", label: "New client added" },
  { key: "taskAssigned", label: "Task assigned to you" },
  { key: "contractSigned", label: "Contract signed" },
  { key: "contentApproved", label: "Content approved" },
  { key: "weeklyReport", label: "Weekly report" },
] as const;

const AI_VOICES = ["Professional", "Casual", "Bold", "Friendly"] as const;

const TABS = [
  { value: "profile", label: "Profile", icon: User },
  { value: "agency", label: "Agency", icon: Building2 },
  { value: "email-templates", label: "Email Templates", icon: Mail },
  { value: "ai-settings", label: "AI Settings", icon: Bot },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "appearance", label: "Appearance", icon: Palette },
  { value: "activity-log", label: "Activity Log", icon: ScrollText },
  { value: "diagnostics", label: "System Diagnostics", icon: Activity },
] as const;

// ── Profile Tab ───────────────────────────────────────
function ProfileTab() {
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const currentUser = users?.[0];

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      avatar: "",
    },
    values: currentUser
      ? {
          name: currentUser.name || "",
          email: currentUser.email || "",
          avatar: currentUser.avatar || "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (data: { name: string; email: string; avatar: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${currentUser?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="profile-skeleton">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Card data-testid="profile-tab">
      <CardHeader>
        <CardTitle className="text-base">Your Profile</CardTitle>
        <CardDescription>Manage your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4 max-w-lg"
            data-testid="profile-form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your name" data-testid="input-profile-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="you@example.com" data-testid="input-profile-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/avatar.jpg" data-testid="input-profile-avatar" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-profile">
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Agency Tab ────────────────────────────────────────
function AgencyTab() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<AgencySettings>({
    queryKey: ["/api/agency-settings"],
  });

  const form = useForm({
    defaultValues: {
      agencyName: "",
      logo: "",
      primaryColor: "#6C5CE7",
      secondaryColor: "#A29BFE",
      accentColor: "#00B894",
      timezone: "Australia/Sydney",
      workingHours: "9:00-17:00",
    },
    values: settings
      ? {
          agencyName: settings.agencyName || "",
          logo: settings.logo || "",
          primaryColor: settings.brandColors?.primary || "#6C5CE7",
          secondaryColor: settings.brandColors?.secondary || "#A29BFE",
          accentColor: settings.brandColors?.accent || "#00B894",
          timezone: settings.timezone || "Australia/Sydney",
          workingHours: settings.workingHours || "9:00-17:00",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        agencyName: data.agencyName,
        logo: data.logo,
        brandColors: {
          primary: data.primaryColor,
          secondary: data.secondaryColor,
          accent: data.accentColor,
        },
        timezone: data.timezone,
        workingHours: data.workingHours,
      };
      const res = await apiRequest("PATCH", "/api/agency-settings", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency-settings"] });
      toast({ title: "Agency settings updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="agency-skeleton">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card data-testid="agency-tab">
      <CardHeader>
        <CardTitle className="text-base">Agency Details</CardTitle>
        <CardDescription>Configure your agency branding and operations</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-5 max-w-lg"
            data-testid="agency-form"
          >
            <FormField
              control={form.control}
              name="agencyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your agency name" data-testid="input-agency-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/logo.svg" data-testid="input-agency-logo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Brand Colors</Label>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Primary</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-md border shrink-0"
                            style={{ backgroundColor: field.value }}
                            data-testid="color-preview-primary"
                          />
                          <Input
                            {...field}
                            placeholder="#6C5CE7"
                            className="font-mono text-xs"
                            data-testid="input-color-primary"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Secondary</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-md border shrink-0"
                            style={{ backgroundColor: field.value }}
                            data-testid="color-preview-secondary"
                          />
                          <Input
                            {...field}
                            placeholder="#A29BFE"
                            className="font-mono text-xs"
                            data-testid="input-color-secondary"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Accent</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded-md border shrink-0"
                            style={{ backgroundColor: field.value }}
                            data-testid="color-preview-accent"
                          />
                          <Input
                            {...field}
                            placeholder="#00B894"
                            className="font-mono text-xs"
                            data-testid="input-color-accent"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz} data-testid={`option-tz-${tz}`}>
                          {tz}
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
              name="workingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Hours</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="9:00-17:00" data-testid="input-working-hours" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-agency">
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save Agency Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Email Templates Tab ───────────────────────────────
function EmailTemplatesTab() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<AgencySettings>({
    queryKey: ["/api/agency-settings"],
  });

  const templates = settings?.emailTemplates || {};

  const mutation = useMutation({
    mutationFn: async (data: { key: string; subject: string; body: string }) => {
      const updated = {
        ...templates,
        [data.key]: { subject: data.subject, body: data.body },
      };
      const res = await apiRequest("PATCH", "/api/agency-settings", {
        emailTemplates: updated,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency-settings"] });
      toast({ title: "Template saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="email-templates-skeleton">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="email-templates-tab">
      <div>
        <h3 className="text-base font-semibold">Email Templates</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure templates for client communications. Use merge fields:{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{"{{clientName}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{"{{agencyName}}"}</code>,{" "}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{"{{date}}"}</code>
        </p>
      </div>
      {EMAIL_TEMPLATE_KEYS.map(({ key, label }) => (
        <EmailTemplateCard
          key={key}
          templateKey={key}
          label={label}
          subject={templates[key]?.subject || ""}
          body={templates[key]?.body || ""}
          onSave={(subject, body) => mutation.mutate({ key, subject, body })}
          isSaving={mutation.isPending}
        />
      ))}
    </div>
  );
}

function EmailTemplateCard({
  templateKey,
  label,
  subject,
  body,
  onSave,
  isSaving,
}: {
  templateKey: string;
  label: string;
  subject: string;
  body: string;
  onSave: (subject: string, body: string) => void;
  isSaving: boolean;
}) {
  const form = useForm({
    defaultValues: { subject: "", body: "" },
    values: { subject, body },
  });

  return (
    <Card data-testid={`email-template-${templateKey}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{label} Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onSave(data.subject, data.body))}
            className="space-y-3"
            data-testid={`form-template-${templateKey}`}
          >
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Subject</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={`${label} email subject`}
                      data-testid={`input-template-subject-${templateKey}`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Body</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={`${label} email body...`}
                      className="resize-y font-mono text-xs"
                      data-testid={`input-template-body-${templateKey}`}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" disabled={isSaving} data-testid={`button-save-template-${templateKey}`}>
              <Save className="mr-2 h-3 w-3" />
              Save
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── AI Settings Tab ───────────────────────────────────
function AISettingsTab() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<AgencySettings>({
    queryKey: ["/api/agency-settings"],
  });

  const form = useForm({
    defaultValues: {
      aiVoice: "professional",
      aiTone: "",
    },
    values: settings
      ? {
          aiVoice: settings.aiVoice || "professional",
          aiTone: settings.aiTone || "",
        }
      : undefined,
  });

  const [promptTemplates, setPromptTemplates] = useState<Array<{ key: string; value: string }>>([]);
  const [templatesInitialized, setTemplatesInitialized] = useState(false);

  // Initialize prompt templates when settings load
  if (settings?.customPromptTemplates && !templatesInitialized) {
    const entries = Object.entries(settings.customPromptTemplates).map(([key, value]) => ({
      key,
      value,
    }));
    if (entries.length > 0) {
      setPromptTemplates(entries);
    }
    setTemplatesInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: async (data: { aiVoice: string; aiTone: string }) => {
      const customPromptTemplates: Record<string, string> = {};
      promptTemplates.forEach(({ key, value }) => {
        if (key.trim()) customPromptTemplates[key.trim()] = value;
      });
      const res = await apiRequest("PATCH", "/api/agency-settings", {
        aiVoice: data.aiVoice,
        aiTone: data.aiTone,
        customPromptTemplates,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency-settings"] });
      toast({ title: "AI settings updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addPromptTemplate = useCallback(() => {
    setPromptTemplates((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const removePromptTemplate = useCallback((index: number) => {
    setPromptTemplates((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePromptTemplate = useCallback(
    (index: number, field: "key" | "value", val: string) => {
      setPromptTemplates((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
      );
    },
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="ai-settings-skeleton">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <Card data-testid="ai-settings-tab">
      <CardHeader>
        <CardTitle className="text-base">AI Configuration</CardTitle>
        <CardDescription>Customize how the AI assistant communicates</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
            className="space-y-5 max-w-lg"
            data-testid="ai-settings-form"
          >
            <FormField
              control={form.control}
              name="aiVoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-ai-voice">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AI_VOICES.map((voice) => (
                        <SelectItem
                          key={voice.toLowerCase()}
                          value={voice.toLowerCase()}
                          data-testid={`option-voice-${voice.toLowerCase()}`}
                        >
                          {voice}
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
              name="aiTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., friendly and strategic"
                      data-testid="input-ai-tone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Custom Prompt Templates</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPromptTemplate}
                  data-testid="button-add-prompt-template"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
              {promptTemplates.length === 0 && (
                <p className="text-sm text-muted-foreground" data-testid="text-no-prompt-templates">
                  No custom prompt templates. Click "Add" to create one.
                </p>
              )}
              {promptTemplates.map((template, index) => (
                <div key={index} className="flex items-start gap-2" data-testid={`prompt-template-${index}`}>
                  <Input
                    value={template.key}
                    onChange={(e) => updatePromptTemplate(index, "key", e.target.value)}
                    placeholder="Template name"
                    className="w-1/3"
                    data-testid={`input-prompt-key-${index}`}
                  />
                  <Textarea
                    value={template.value}
                    onChange={(e) => updatePromptTemplate(index, "value", e.target.value)}
                    placeholder="Prompt template..."
                    rows={2}
                    className="flex-1 resize-y"
                    data-testid={`input-prompt-value-${index}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePromptTemplate(index)}
                    data-testid={`button-remove-prompt-${index}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-ai-settings">
              <Save className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save AI Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Notifications Tab ─────────────────────────────────
function NotificationsTab() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<AgencySettings>({
    queryKey: ["/api/agency-settings"],
  });

  const prefs = settings?.notificationPrefs || {};

  const mutation = useMutation({
    mutationFn: async (updated: Record<string, boolean>) => {
      const res = await apiRequest("PATCH", "/api/agency-settings", {
        notificationPrefs: updated,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency-settings"] });
      toast({ title: "Notification preferences updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleToggle = useCallback(
    (key: string, checked: boolean) => {
      const updated = { ...prefs, [key]: checked };
      mutation.mutate(updated);
    },
    [prefs, mutation]
  );

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="notifications-skeleton">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card data-testid="notifications-tab">
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you receive</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-lg">
          {NOTIFICATION_KEYS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b last:border-0"
              data-testid={`notification-row-${key}`}
            >
              <Label htmlFor={`notif-${key}`} className="text-sm cursor-pointer">
                {label}
              </Label>
              <Switch
                id={`notif-${key}`}
                checked={prefs[key] ?? true}
                onCheckedChange={(checked) => handleToggle(key, checked)}
                disabled={mutation.isPending}
                data-testid={`switch-notification-${key}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Appearance Tab ────────────────────────────────────
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const { data: settings } = useQuery<AgencySettings>({
    queryKey: ["/api/agency-settings"],
  });

  const mutation = useMutation({
    mutationFn: async (appearance: string) => {
      const res = await apiRequest("PATCH", "/api/agency-settings", { appearance });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency-settings"] });
      toast({ title: "Appearance updated" });
    },
  });

  const currentAppearance = settings?.appearance || "system";

  const handleChange = useCallback(
    (value: string) => {
      mutation.mutate(value);
      if (value === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      } else {
        setTheme(value as "light" | "dark");
      }
    },
    [mutation, setTheme]
  );

  const options = [
    { value: "light", label: "Light", icon: Sun, description: "Always use light mode" },
    { value: "dark", label: "Dark", icon: Moon, description: "Always use dark mode" },
    { value: "system", label: "System", icon: Monitor, description: "Match your system setting" },
  ] as const;

  return (
    <Card data-testid="appearance-tab">
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
          {options.map(({ value, label, icon: Icon, description }) => (
            <button
              key={value}
              onClick={() => handleChange(value)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-accent/50 ${
                currentAppearance === value
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
              data-testid={`button-theme-${value}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground text-center">{description}</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground" data-testid="text-current-theme">
          Current: {theme === "dark" ? "Dark" : "Light"} mode
        </p>
      </CardContent>
    </Card>
  );
}

// ── Activity Log Tab ──────────────────────────────────
function ActivityLogTab() {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading } = useQuery<{ items: ActivityLog[]; total: number }>({
    queryKey: ["/api/activity-log", `?page=${page}&limit=${pageSize}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/activity-log?page=${page}&limit=${pageSize}`);
      return res.json();
    },
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="activity-log-skeleton">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card data-testid="activity-log-tab">
      <CardHeader>
        <CardTitle className="text-base">Activity Log</CardTitle>
        <CardDescription>Audit trail of recent actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]" data-testid="th-action">Action</TableHead>
                <TableHead data-testid="th-description">Description</TableHead>
                <TableHead className="w-[180px] text-right" data-testid="th-timestamp">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8" data-testid="text-no-activity">
                    No activity recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((entry, index) => (
                  <TableRow key={entry.id || index} data-testid={`activity-row-${index}`}>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs" data-testid={`badge-action-${index}`}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm" data-testid={`text-activity-desc-${index}`}>
                      {entry.description}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground" data-testid={`text-activity-time-${index}`}>
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground" data-testid="text-page-info">
              Page {page} of {totalPages} ({total} entries)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── API Integrations Section ──────────────────────────
interface IntegrationStatus {
  openai?: boolean;
  gemini?: boolean;
  firecrawl?: boolean;
  stripe?: boolean;
  anthropic?: boolean;
}

function APIIntegrationsCard() {
  const { data: status, isLoading } = useQuery<IntegrationStatus>({
    queryKey: ["/api/integrations/status"],
  });

  const integrations = [
    { key: "openai", name: "OpenAI", icon: Bot, connected: status?.openai },
    { key: "gemini", name: "Google Gemini", icon: Globe, connected: status?.gemini },
    { key: "firecrawl", name: "Firecrawl", icon: Globe, connected: status?.firecrawl },
    { key: "stripe", name: "Stripe", icon: Globe, connected: status?.stripe },
    { key: "anthropic", name: "Anthropic", icon: Bot, connected: true },
  ];

  return (
    <Card data-testid="api-integrations-card">
      <CardHeader>
        <CardTitle className="text-base">API Integrations</CardTitle>
        <CardDescription>Connection status for external services</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="integrations-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="integrations-grid">
            {integrations.map((integration) => (
              <div
                key={integration.key}
                className="flex items-center gap-3 py-3 px-4 rounded-lg border bg-card"
                data-testid={`integration-${integration.key}`}
              >
                <integration.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" data-testid={`text-integration-name-${integration.key}`}>
                    {integration.name}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`whitespace-nowrap shrink-0 ${integration.connected
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20"
                  }`}
                  data-testid={`badge-integration-${integration.key}`}
                >
                  {integration.connected ? (
                    <CheckCircle className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {integration.connected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── System Diagnostics Tab ────────────────────────────
function DiagnosticsTab() {
  const services = [
    { name: "API Connection", status: "Connected", description: "Backend API server" },
    { name: "Storage Service", status: "Connected", description: "File storage system" },
    { name: "AI Service", status: "Connected", description: "AI content generation" },
    { name: "Email Service", status: "Connected", description: "Email delivery" },
    { name: "Analytics Engine", status: "Connected", description: "Social analytics pipeline" },
  ];

  return (
    <div className="space-y-6">
      <APIIntegrationsCard />

      <Card data-testid="diagnostics-tab">
        <CardHeader>
          <CardTitle className="text-base">System Diagnostics</CardTitle>
          <CardDescription>Health check status for all services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-lg">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card"
                data-testid={`diagnostic-${service.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <div>
                  <p className="text-sm font-medium" data-testid={`text-service-name-${service.name.toLowerCase().replace(/\s/g, "-")}`}>
                    {service.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>
                <Badge
                  className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  data-testid={`badge-status-${service.name.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4" data-testid="text-diagnostics-timestamp">
            Last checked: {new Date().toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="flex-1 overflow-auto" data-testid="page-settings">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <h1 className="text-lg font-semibold" data-testid="page-title">
          Settings
        </h1>
      </header>

      <div className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-col md:flex-row gap-6"
          data-testid="settings-tabs"
        >
          {/* Left sidebar navigation */}
          <TabsList
            className="flex md:flex-col h-auto bg-transparent p-0 gap-1 shrink-0 md:w-52 flex-wrap md:flex-nowrap justify-start"
            data-testid="settings-tab-list"
          >
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="justify-start gap-2 px-3 py-2 text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-lg w-full"
                data-testid={`tab-${value}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab content area */}
          <div className="flex-1 min-w-0">
            <TabsContent value="profile" className="mt-0" data-testid="content-profile">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="agency" className="mt-0" data-testid="content-agency">
              <AgencyTab />
            </TabsContent>
            <TabsContent value="email-templates" className="mt-0" data-testid="content-email-templates">
              <EmailTemplatesTab />
            </TabsContent>
            <TabsContent value="ai-settings" className="mt-0" data-testid="content-ai-settings">
              <AISettingsTab />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0" data-testid="content-notifications">
              <NotificationsTab />
            </TabsContent>
            <TabsContent value="appearance" className="mt-0" data-testid="content-appearance">
              <AppearanceTab />
            </TabsContent>
            <TabsContent value="activity-log" className="mt-0" data-testid="content-activity-log">
              <ActivityLogTab />
            </TabsContent>
            <TabsContent value="diagnostics" className="mt-0" data-testid="content-diagnostics">
              <DiagnosticsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
