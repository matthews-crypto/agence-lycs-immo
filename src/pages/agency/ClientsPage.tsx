
import React from 'react';
import { AgencySidebar } from "@/components/agency/AgencySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ClientsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AgencySidebar />
        <div className="flex-1 p-8">
          {/* Empty content as requested */}
        </div>
      </div>
    </SidebarProvider>
  );
}
