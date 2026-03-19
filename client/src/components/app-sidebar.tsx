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
];

function TLMLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TLM Agency Engine"
    >
      {/* Geometric T-L-M mark */}
      <rect x="2" y="2" width="28" height="28" rx="6" fill="hsl(246 75% 59%)" />
      <path
        d="M8 10H14V12H12V22H10V12H8V10Z"
        fill="white"
      />
      <path
        d="M15 10H17V20H21V22H15V10Z"
        fill="white"
      />
      <path
        d="M22 10H24.5L26 16L27.5 10H30V22H28V14L26.5 20H25.5L24 14V22H22V10Z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" data-testid="app-sidebar">
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="sidebar-logo-link">
          <div className="flex items-center gap-3">
            <TLMLogo />
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
                TLM Engine
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">
                Agency OS
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Main */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
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
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
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
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
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
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/settings")}
              tooltip="Settings"
              data-testid="nav-settings"
            >
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
