import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarDays,
  ListTodo,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  User as UserIcon,
  Building2,
} from "lucide-react";
import type { Task, Client, User } from "@shared/schema";

// ── Types & Constants ─────────────────────────────
type TaskStatus = "todo" | "in_progress" | "complete";

const COLUMN_CONFIG: { status: TaskStatus; label: string; color: string; bg: string; border: string }[] = [
  {
    status: "todo",
    label: "To Do",
    color: "text-muted-foreground",
    bg: "bg-muted/50",
    border: "border-muted-foreground/20",
  },
  {
    status: "in_progress",
    label: "In Progress",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/5",
    border: "border-sky-500/20",
  },
  {
    status: "complete",
    label: "Complete",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
  },
];

// ── Form Schema ───────────────────────────────────
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "complete"]).default("todo"),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// ── Helpers ───────────────────────────────────────
function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || status === "complete") return false;
  return new Date(dueDate) < new Date(new Date().toISOString().split("T")[0]);
}

function isDueToday(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  return dueDate === new Date().toISOString().split("T")[0];
}

function isDueThisWeek(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  const due = new Date(dueDate);
  return due >= today && due <= endOfWeek;
}

function formatDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return "";
  return new Date(dueDate).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
}

// ── Skeleton ──────────────────────────────────────
function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="kanban-skeleton">
      {[0, 1, 2].map((col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Sortable Task Card ────────────────────────────
function SortableTaskCard({
  task,
  users,
  clients,
  onEdit,
  onDelete,
}: {
  task: Task;
  users: User[];
  clients: Client[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "opacity-40" : ""}`}
      data-testid={`task-card-${task.id}`}
    >
      <TaskCardContent
        task={task}
        users={users}
        clients={clients}
        onEdit={onEdit}
        onDelete={onDelete}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
}

// ── Task Card Content (shared between sortable & overlay) ──
function TaskCardContent({
  task,
  users,
  clients,
  onEdit,
  onDelete,
  dragAttributes,
  dragListeners,
}: {
  task: Task;
  users: User[];
  clients: Client[];
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  dragAttributes?: Record<string, any>;
  dragListeners?: Record<string, any>;
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  const assignedUser = users.find((u) => u.id === task.assignedTo);
  const linkedClient = clients.find((c) => c.id === task.clientId);

  return (
    <Card
      className={`cursor-default border ${
        overdue ? "border-red-500/40 bg-red-500/5" : ""
      }`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            className="mt-0.5 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
            {...(dragAttributes ?? {})}
            {...(dragListeners ?? {})}
            data-testid={`drag-handle-${task.id}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h4
              className="text-sm font-medium leading-snug line-clamp-2"
              data-testid={`task-title-${task.id}`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p
                className="text-xs text-muted-foreground mt-0.5 line-clamp-2"
                data-testid={`task-desc-${task.id}`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* Actions menu */}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  data-testid={`task-menu-${task.id}`}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={() => onEdit?.(task)}
                  data-testid={`task-edit-${task.id}`}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={() => onDelete?.(task.id)}
                  data-testid={`task-delete-${task.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {task.dueDate && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 gap-1 ${
                overdue
                  ? "border-red-500/40 text-red-600 dark:text-red-400"
                  : isDueToday(task.dueDate)
                  ? "border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : ""
              }`}
              data-testid={`task-due-${task.id}`}
            >
              <CalendarDays className="h-3 w-3" />
              {formatDueDate(task.dueDate)}
              {overdue && " (overdue)"}
            </Badge>
          )}

          {assignedUser && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-1"
              data-testid={`task-assignee-${task.id}`}
            >
              <UserIcon className="h-3 w-3" />
              {assignedUser.name}
            </Badge>
          )}

          {linkedClient && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 gap-1"
              data-testid={`task-client-${task.id}`}
            >
              <Building2 className="h-3 w-3" />
              {linkedClient.businessName}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Kanban Column ─────────────────────────────────
function KanbanColumn({
  config,
  tasks: columnTasks,
  users,
  clients,
  onEdit,
  onDelete,
}: {
  config: (typeof COLUMN_CONFIG)[0];
  tasks: Task[];
  users: User[];
  clients: Client[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`rounded-lg border ${config.border} ${config.bg} min-h-[400px]`}
      data-testid={`kanban-column-${config.status}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${config.color}`}>
            {config.label}
          </h3>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 tabular-nums"
            data-testid={`kanban-count-${config.status}`}
          >
            {columnTasks.length}
          </Badge>
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2">
        <SortableContext
          items={columnTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {columnTasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              users={users}
              clients={clients}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {columnTasks.length === 0 && (
          <p
            className="text-xs text-muted-foreground text-center py-8"
            data-testid={`kanban-empty-${config.status}`}
          >
            No tasks
          </p>
        )}
      </div>
    </div>
  );
}

// ── Task Form Dialog ──────────────────────────────
function TaskFormDialog({
  open,
  onOpenChange,
  editTask,
  users,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask: Task | null;
  users: User[];
  clients: Client[];
}) {
  const { toast } = useToast();
  const isEditing = !!editTask;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: editTask?.title ?? "",
      description: editTask?.description ?? "",
      status: (editTask?.status as TaskStatus) ?? "todo",
      dueDate: editTask?.dueDate ?? "",
      assignedTo: editTask?.assignedTo ?? "",
      clientId: editTask?.clientId ?? "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const body = {
        ...values,
        assignedTo: values.assignedTo || null,
        clientId: values.clientId || null,
        dueDate: values.dueDate || null,
        description: values.description || null,
      };
      const res = await apiRequest("POST", "/api/tasks", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const body = {
        ...values,
        assignedTo: values.assignedTo || null,
        clientId: values.clientId || null,
        dueDate: values.dueDate || null,
        description: values.description || null,
      };
      const res = await apiRequest("PATCH", `/api/tasks/${editTask!.id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="task-form-dialog">
        <DialogHeader>
          <DialogTitle data-testid="task-form-title">
            {isEditing ? "Edit Task" : "Add Task"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="task-form"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Task title"
                      {...field}
                      data-testid="input-task-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      rows={3}
                      {...field}
                      data-testid="input-task-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-task-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value ?? ""} onChange={field.onChange} placeholder="Select due date" data-testid="input-task-due-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-task-assignee">
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem
                          key={u.id}
                          value={u.id}
                          data-testid={`assignee-option-${u.id}`}
                        >
                          {u.name}
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
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-task-client">
                        <SelectValue placeholder="Select client (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {clients.map((c) => (
                        <SelectItem
                          key={c.id}
                          value={c.id}
                          data-testid={`client-option-${c.id}`}
                        >
                          {c.businessName}
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
                data-testid="btn-cancel-task"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="btn-submit-task"
              >
                {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────
export default function Tasks() {
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Fetch users for assignment
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch clients for linking
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    },
  });

  // Status update mutation (for drag-and-drop)
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task status", variant: "destructive" });
    },
  });

  // ── DnD Sensors ────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // ── Grouped tasks ──────────────────────────────
  const grouped = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      complete: [],
    };
    (tasks ?? []).forEach((t) => {
      const status = (t.status as TaskStatus) ?? "todo";
      if (result[status]) {
        result[status].push(t);
      } else {
        result.todo.push(t);
      }
    });
    return result;
  }, [tasks]);

  // ── Stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const allTasks = tasks ?? [];
    const total = allTasks.length;
    const complete = allTasks.filter((t) => t.status === "complete").length;
    const completionPct = total > 0 ? Math.round((complete / total) * 100) : 0;
    const overdue = allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
    const dueToday = allTasks.filter((t) => isDueToday(t.dueDate) && t.status !== "complete").length;
    const dueThisWeek = allTasks.filter(
      (t) => isDueThisWeek(t.dueDate) && t.status !== "complete"
    ).length;
    const active = allTasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress"
    ).length;
    return { total, complete, completionPct, overdue, dueToday, dueThisWeek, active };
  }, [tasks]);

  // ── DnD Handlers ───────────────────────────────
  function findColumnForTask(taskId: string): TaskStatus | null {
    for (const [status, list] of Object.entries(grouped)) {
      if (list.some((t) => t.id === taskId)) return status as TaskStatus;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    // Not needed for simple column-based drop
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Determine which column we're dropping into
    const sourceColumn = findColumnForTask(activeTaskId);
    let targetColumn: TaskStatus | null = null;

    // Check if over a column ID directly
    if (["todo", "in_progress", "complete"].includes(overId)) {
      targetColumn = overId as TaskStatus;
    } else {
      // Over another task — find its column
      targetColumn = findColumnForTask(overId);
    }

    if (!targetColumn || !sourceColumn) return;

    // Only update if column changed
    if (sourceColumn !== targetColumn) {
      statusMutation.mutate({ id: activeTaskId, status: targetColumn });
    }
  }

  // ── Action Handlers ────────────────────────────
  function handleEdit(task: Task) {
    setEditTask(task);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  function handleOpenCreate() {
    setEditTask(null);
    setDialogOpen(true);
  }

  const activeTask = activeId
    ? (tasks ?? []).find((t) => t.id === activeId) ?? null
    : null;

  return (
    <div className="flex-1 overflow-auto" data-testid="page-tasks">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">
              Tasks
            </h1>
            <p className="text-sm text-muted-foreground">Manage and track your team's work</p>
          </div>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            data-testid="btn-add-task"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
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
              Team workload and delivery pressure
            </h2>
          </div>
        {/* ── Stats Row ────────────────────────────── */}
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          data-testid="task-stats-row"
        >
          <Card className="glass-card" data-testid="stat-completion">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <div className="text-lg font-bold tabular-nums" data-testid="value-completion">
                  {tasksLoading ? (
                    <Skeleton className="h-5 w-10 inline-block" />
                  ) : (
                    `${stats.completionPct}%`
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="stat-overdue">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <div className="text-lg font-bold tabular-nums" data-testid="value-overdue">
                  {tasksLoading ? (
                    <Skeleton className="h-5 w-10 inline-block" />
                  ) : (
                    stats.overdue
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="stat-due-today">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Today</p>
                <div className="text-lg font-bold tabular-nums" data-testid="value-due-today">
                  {tasksLoading ? (
                    <Skeleton className="h-5 w-10 inline-block" />
                  ) : (
                    stats.dueToday
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="stat-due-week">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due This Week</p>
                <div className="text-lg font-bold tabular-nums" data-testid="value-due-week">
                  {tasksLoading ? (
                    <Skeleton className="h-5 w-10 inline-block" />
                  ) : (
                    stats.dueThisWeek
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="stat-active">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <ListTodo className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Active</p>
                <div className="text-lg font-bold tabular-nums" data-testid="value-active">
                  {tasksLoading ? (
                    <Skeleton className="h-5 w-10 inline-block" />
                  ) : (
                    stats.active
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </section>

        {/* ── Kanban Board ─────────────────────────── */}
        {tasksLoading ? (
          <KanbanSkeleton />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              className="grid grid-cols-1 gap-5 md:grid-cols-3"
              data-testid="kanban-board"
            >
              {COLUMN_CONFIG.map((config) => (
                <KanbanColumn
                  key={config.status}
                  config={config}
                  tasks={grouped[config.status]}
                  users={users ?? []}
                  clients={clients ?? []}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="w-[340px]">
                  <TaskCardContent
                    task={activeTask}
                    users={users ?? []}
                    clients={clients ?? []}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Task Form Dialog ───────────────────────── */}
      {dialogOpen && (
        <TaskFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditTask(null);
          }}
          editTask={editTask}
          users={users ?? []}
          clients={clients ?? []}
        />
      )}
    </div>
  );
}
