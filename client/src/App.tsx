import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";

import Dashboard from "@/pages/dashboard";
import SalesPipeline from "@/pages/sales-pipeline";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import ContentCalendar from "@/pages/calendar";
import AiPlanner from "@/pages/ai-planner";
import SavedPlans from "@/pages/saved-plans";
import ImageStudio from "@/pages/image-studio";
import Analytics from "@/pages/analytics";
import Tasks from "@/pages/tasks";
import Team from "@/pages/team";
import Contracts from "@/pages/contracts";
import ContractDetail from "@/pages/contract-detail";
import Invoices from "@/pages/invoices";
import Settings from "@/pages/settings";
import PublicPortal from "@/pages/public-portal";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={SalesPipeline} />
      <Route path="/clients" component={Clients} />
      <Route path="/clients/:id">{(params) => <ClientDetail params={params} />}</Route>
      <Route path="/calendar" component={ContentCalendar} />
      <Route path="/ai-planner" component={AiPlanner} />
      <Route path="/saved-plans" component={SavedPlans} />
      <Route path="/image-studio" component={ImageStudio} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/team" component={Team} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/contracts/:id">{(params) => <ContractDetail params={params} />}</Route>
      <Route path="/invoices" component={Invoices} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();

  // Public portal routes render without sidebar
  if (location.startsWith("/public/")) {
    return (
      <Switch>
        <Route path="/public/:token" component={PublicPortal} />
      </Switch>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <AppRouter />
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppLayout />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
