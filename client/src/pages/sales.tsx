import { SidebarTrigger } from "@/components/ui/sidebar";

export default function SalesPipeline() {
  return (
    <div className="flex-1 overflow-auto" data-testid="page-sales">
      <header className="sticky top-0 z-10 glass-header px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger data-testid="sidebar-trigger" />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight" data-testid="page-title">Sales Pipeline</h1>
            <p className="text-sm text-muted-foreground">Track leads and deals</p>
          </div>
        </div>
      </header>
      <div className="p-6">
        <p className="text-muted-foreground">Sales Pipeline page — coming soon</p>
      </div>
    </div>
  );
}
