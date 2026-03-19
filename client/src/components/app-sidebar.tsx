import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  Image,
  BookmarkCheck,
  BarChart3,
  CheckSquare,
  UserCog,
  FileText,
  Receipt,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sales Pipeline", href: "/sales", icon: TrendingUp },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Content Calendar", href: "/calendar", icon: Calendar },
];

const aiToolsNav = [
  { label: "Content Planner", href: "/ai-planner", icon: Sparkles },
  { label: "Image Studio", href: "/image-studio", icon: Image },
  { label: "Saved Plans", href: "/saved-plans", icon: BookmarkCheck },
];

const opsNav = [
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Team", href: "/team", icon: UserCog },
  { label: "Contracts", href: "/contracts", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
];

function TLMLogo() {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/30 to-amber-400/30 blur-lg" />
      <svg
        width="36"
        height="36"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="TLM Agency Engine"
        className="relative"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#logo-grad)" />
        <path d="M8 10H14V12H12V22H10V12H8V10Z" fill="white" />
        <path d="M15 10H17V20H21V22H15V10Z" fill="white" />
        <path
          d="M22 10H24.5L26 16L27.5 10H30V22H28V14L26.5 20H25.5L24 14V22H22V10Z"
          fill="white"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="app-sidebar-shell"
      data-testid="app-sidebar"
    >
      <SidebarHeader className="p-5 pb-4">
        <Link href="/" data-testid="sidebar-logo-link">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/12 bg-white/6 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 hover:bg-white/10">
            <TLMLogo />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-[15px] font-bold text-sidebar-foreground tracking-tight">
                TLM Engine
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] bg-gradient-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                Agency OS
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="opacity-[0.06]" />

      <SidebarContent className="px-1">
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40 px-3">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="!h-[18px] !w-[18px]" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40 px-3 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-orange-400/60" />
            AI Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiToolsNav.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="!h-[18px] !w-[18px]" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40 px-3">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {opsNav.map(item => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="!h-[18px] !w-[18px]" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        <div className="group-data-[collapsible=icon]:hidden rounded-[24px] border border-white/10 bg-white/8 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
            Workspace
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400/80 to-amber-300/80 text-sm font-semibold text-slate-950">
              TL
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                TLM Studio
              </p>
              <p className="truncate text-xs text-sidebar-foreground/55">
                Agency operations hub
              </p>
            </div>
          </div>
        </div>
        <SidebarMenu className="mt-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/settings")}
              tooltip="Settings"
              data-testid="nav-settings"
            >
              <Link href="/settings">
                <Settings className="!h-[18px] !w-[18px]" />
                <span className="font-medium">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
