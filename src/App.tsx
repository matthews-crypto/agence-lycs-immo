import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import AgencyDashboardPage from "@/pages/agency/DashboardPage";
import AgencyPropertiesPage from "@/pages/agency/PropertiesPage";
import AgencyClientsPage from "@/pages/agency/ClientsPage";
import AgencyAgentsPage from "@/pages/agency/AgentsPage";
import AgencySettingsPage from "@/pages/agency/SettingsPage";
import AgencyAppointmentsPage from "@/pages/agency/AppointmentsPage";
import AgentDashboardPage from "@/pages/agency/agent/DashboardPage";
import AgentPropertiesPage from "@/pages/agency/agent/PropertiesPage";
import AgentClientsPage from "@/pages/agency/agent/ClientsPage";
import AgentAppointmentsPage from "@/pages/agency/agent/AppointmentsPage";
import AgentSettingsPage from "@/pages/agency/agent/SettingsPage";
import PropertyImagesPage from "@/pages/agency/PropertyImagesPage";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/:slug">
          <Route path="dashboard" element={<AgencyDashboardPage />} />
          <Route path="properties" element={<AgencyPropertiesPage />} />
          <Route path="properties/:id/images" element={<PropertyImagesPage />} />
          <Route path="clients" element={<AgencyClientsPage />} />
          <Route path="agents" element={<AgencyAgentsPage />} />
          <Route path="appointments" element={<AgencyAppointmentsPage />} />
          <Route path="settings" element={<AgencySettingsPage />} />
          <Route path="agent">
            <Route path="dashboard" element={<AgentDashboardPage />} />
            <Route path="properties" element={<AgentPropertiesPage />} />
            <Route path="clients" element={<AgentClientsPage />} />
            <Route path="appointments" element={<AgentAppointmentsPage />} />
            <Route path="settings" element={<AgentSettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}