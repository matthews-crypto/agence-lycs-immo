
import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import AgencyDashboardPage from "./pages/agency/DashboardPage";
import AgentDashboardPage from "./pages/agency/agent/DashboardPage";
import AgencyLayout from "./layouts/AgencyLayout";
import NotFoundPage from "./pages/NotFoundPage";
import PropertiesPage from "./pages/agency/PropertiesPage";
import SettingsPage from "./pages/agency/SettingsPage";
import ProspectionPage from "./pages/agency/ProspectionPage";

// Create stub components for missing pages
const LandingPage = () => <div>Landing Page</div>;
const AuthPage = () => <div>Auth Page</div>;
const AppointmentsPage = () => <div>Appointments Page</div>;
const ClientsPage = () => <div>Clients Page</div>;
const AnalyticsPage = () => <div>Analytics Page</div>;
const WhatsAppPage = () => <div>WhatsApp Page</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/:agencySlug" element={<LandingPage />} />
        <Route path="/:agencySlug/auth" element={<AuthPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Agency Routes */}
        <Route path="/:agencySlug/agency" element={<AgencyLayout />}>
          <Route path="dashboard" element={<AgencyDashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="prospection" element={<ProspectionPage />} />
        </Route>

        {/* Agent Routes */}
        <Route path="/:agencySlug/agent" element={<AgencyLayout />}>
          <Route path="dashboard" element={<AgentDashboardPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
