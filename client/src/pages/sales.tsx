import { SidebarTrigger } from "@/components/ui/sidebar";

export default function SalesPipeline() {
  return (
    <div className="flex-1 overflow-auto" data-testid="page-sales">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <SidebarTrigger data-testid="sidebar-trigger" />
        <h1 className="text-lg font-semibold" data-testid="page-title">Sales Pipeline</h1>
      </header>
      <div className="p-6">
        <p className="text-muted-foreground">Sales Pipeline page — coming soon</p>
      </div>
    </div>
  );
}
