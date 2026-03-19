import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  UserPlus,
  Users,
  Shield,
  Check,
  X,
  Pencil,
  Mail,
  Clock,
  Info,
  Trash2,
} from "lucide-react";
import type { User, TeamInvite, Client } from "@shared/schema";

// ── Role config ──────────────────────────────────────

const ROLE_OPTIONS = ["owner", "admin", "strategist", "contractor", "editor"] as const;

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
  admin: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  strategist: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  contractor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  editor: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/25",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Full access to everything including billing & settings",
  admin: "Full access to everything except billing",
  strategist: "Assigned clients only — strategy, content, analytics",
  contractor: "Assigned tasks and content only",
  editor: "Assigned tasks and content editing only",
};

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// ── Invite Form Schema ───────────────────────────────

const inviteFormSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

// ── Edit Role Form Schema ────────────────────────────

const editRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
});

type EditRoleValues = z.infer<typeof editRoleSchema>;

// ── Invite Dialog ────────────────────────────────────

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: "", role: "strategist" },
  });

  const inviteMutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      const res = await apiRequest("POST", "/api/team-invites", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invites"] });
      form.reset();
      onOpenChange(false);
      toast({ title: "Invite sent", description: "Team invite has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: InviteFormValues) {
    inviteMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-invite-member">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-invite">Invite Team Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-invite">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="colleague@agency.com"
                      {...field}
                      data-testid="input-invite-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabel(r)}
                        </SelectItem>
                      ))}
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
                data-testid="button-cancel-invite"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending} data-testid="button-submit-invite">
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Role Dialog ─────────────────────────────────

function EditRoleDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}) {
  const { toast } = useToast();

  const form = useForm<EditRoleValues>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { role: user?.role || "strategist" },
  });

  // Reset form when user changes
  if (user && form.getValues("role") !== user.role && !form.formState.isDirty) {
    form.reset({ role: user.role });
  }

  const updateMutation = useMutation({
    mutationFn: async (values: EditRoleValues) => {
      const res = await apiRequest("PATCH", `/api/team/${user?.id}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      onOpenChange(false);
      toast({ title: "Role updated", description: `${user?.name}'s role has been updated.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(values: EditRoleValues) {
    updateMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-edit-role">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title-edit-role">
            Edit Role — {user?.name}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-edit-role">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {roleLabel(r)}
                        </SelectItem>
                      ))}
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
                data-testid="button-cancel-edit-role"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-role">
                {updateMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Pending Invites Section ──────────────────────────

function PendingInvites({ invites }: { invites: TeamInvite[] }) {
  const { toast } = useToast();
  const pending = invites.filter((i) => i.status === "pending");

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/team-invites/${id}`, { status: "approved" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Invite approved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/team-invites/${id}`, { status: "rejected" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invites"] });
      toast({ title: "Invite rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/team-invites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-invites"] });
      toast({ title: "Invite deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (pending.length === 0) return null;

  return (
    <Card data-testid="section-pending-invites">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Pending Invites</CardTitle>
          <Badge variant="secondary" className="ml-auto" data-testid="badge-pending-count">
            {pending.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((invite) => (
              <TableRow key={invite.id} data-testid={`row-invite-${invite.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span data-testid={`text-invite-email-${invite.id}`}>{invite.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={ROLE_STYLES[invite.role] || ""}
                    data-testid={`badge-invite-role-${invite.id}`}
                  >
                    {roleLabel(invite.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground" data-testid={`text-invite-date-${invite.id}`}>
                    {formatDate(invite.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                      onClick={() => approveMutation.mutate(invite.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-invite-${invite.id}`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                      onClick={() => rejectMutation.mutate(invite.id)}
                      disabled={rejectMutation.isPending}
                      data-testid={`button-reject-invite-${invite.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => deleteMutation.mutate(invite.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-invite-${invite.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Role Permissions Legend ───────────────────────────

function RolePermissionsLegend() {
  return (
    <Card data-testid="section-role-permissions">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Role Permissions</CardTitle>
        </div>
        <CardDescription>What each role can access in the agency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {ROLE_OPTIONS.map((role) => (
            <div key={role} className="flex items-start gap-3" data-testid={`permission-${role}`}>
              <Badge variant="outline" className={`${ROLE_STYLES[role]} mt-0.5 shrink-0`}>
                {roleLabel(role)}
              </Badge>
              <span className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Loading Skeleton ─────────────────────────────────

function TeamTableSkeleton() {
  return (
    <Card data-testid="skeleton-team-table">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────

export default function Team() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });

  const { data: invites, isLoading: invitesLoading } = useQuery<TeamInvite[]>({
    queryKey: ["/api/team-invites"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Build map of userId -> assigned clients
  const userClientsMap: Record<string, Client[]> = {};
  if (clients && users) {
    for (const client of clients) {
      const team = client.assignedTeam ?? [];
      for (const userId of team) {
        if (!userClientsMap[userId]) userClientsMap[userId] = [];
        userClientsMap[userId].push(client);
      }
    }
  }

  const isLoading = usersLoading || invitesLoading;

  function handleEditUser(user: User) {
    setEditUser(user);
    setEditOpen(true);
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="page-team">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold" data-testid="page-title">Team</h1>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setInviteOpen(true)} size="sm" data-testid="button-invite-member">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Invite Member
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Team Members Table */}
        {isLoading ? (
          <TeamTableSkeleton />
        ) : (
          <Card data-testid="section-team-members">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Team Members</CardTitle>
                <Badge variant="secondary" className="ml-auto" data-testid="badge-member-count">
                  {(users ?? []).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(users ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-state-team">
                  <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No team members yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Invite your first team member to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Clients</TableHead>
                      <TableHead className="w-[60px]">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(users ?? []).map((user) => {
                      const assignedClients = userClientsMap[user.id] ?? [];
                      return (
                        <TableRow key={user.id} data-testid={`row-member-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0"
                                data-testid={`avatar-${user.id}`}
                              >
                                {user.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="font-medium" data-testid={`text-member-name-${user.id}`}>
                                {user.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground" data-testid={`text-member-email-${user.id}`}>
                              {user.email}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={ROLE_STYLES[user.role] || ""}
                              data-testid={`badge-member-role-${user.id}`}
                            >
                              {roleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignedClients.length === 0 ? (
                              <span className="text-sm text-muted-foreground/60" data-testid={`text-no-clients-${user.id}`}>
                                None
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-1" data-testid={`list-assigned-clients-${user.id}`}>
                                {assignedClients.slice(0, 3).map((c) => (
                                  <Badge key={c.id} variant="secondary" className="text-xs" data-testid={`badge-client-${user.id}-${c.id}`}>
                                    {c.businessName}
                                  </Badge>
                                ))}
                                {assignedClients.length > 3 && (
                                  <Badge variant="secondary" className="text-xs" data-testid={`badge-more-clients-${user.id}`}>
                                    +{assignedClients.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditUser(user)}
                              data-testid={`button-edit-member-${user.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pending Invites */}
        {!isLoading && invites && <PendingInvites invites={invites} />}

        {/* Role Permissions Legend */}
        <RolePermissionsLegend />
      </div>

      {/* Dialogs */}
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <EditRoleDialog open={editOpen} onOpenChange={setEditOpen} user={editUser} />
    </div>
  );
}
