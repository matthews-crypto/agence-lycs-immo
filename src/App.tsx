import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AgencyDashboardPage from "@/pages/agency/DashboardPage";
import AgencyPropertiesPage from "@/pages/agency/PropertiesPage";
import AgencyAgentsPage from "@/pages/agency/AgentsPage";
import AgentDashboardPage from "@/pages/agency/agent/DashboardPage";
import AgentPropertiesPage from "@/pages/agency/agent/PropertiesPage";
import AgentAppointmentsPage from "@/pages/agency/agent/AppointmentsPage";
import PropertyImagesPage from "@/pages/agency/PropertyImagesPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/:slug">
          <Route path="dashboard" element={<AgencyDashboardPage />} />
          <Route path="properties" element={<AgencyPropertiesPage />} />
          <Route path="properties/:id/images" element={<PropertyImagesPage />} />
          <Route path="agents" element={<AgencyAgentsPage />} />
          <Route path="agent">
            <Route path="dashboard" element={<AgentDashboardPage />} />
            <Route path="properties" element={<AgentPropertiesPage />} />
            <Route path="appointments" element={<AgentAppointmentsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}