
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AgencySidebar } from "@/components/agency/AgencySidebar";

export default function ClientsPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AgencySidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Clients</h1>
            <div className="bg-card rounded-lg p-6 border">
              <p className="text-muted-foreground">
                Gérez vos clients ici.
              </p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
