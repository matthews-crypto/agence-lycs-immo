
import React from 'react';
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ClientsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Agency Clients</h1>
            <p className="text-muted-foreground">Manage and view information about your clients</p>
          </div>
          
          {/* Content removed as requested - will be implemented later */}
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium">Client management coming soon</h3>
            <p className="text-muted-foreground">
              This section is currently being simplified and will be updated later.
            </p>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
