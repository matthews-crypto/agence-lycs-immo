import { Routes as RouterRoutes, Route } from "react-router-dom"
import { HomePage } from "@/pages/HomePage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { AdminLayout } from "@/layouts/AdminLayout"
import { AgencyLayout } from "@/layouts/AgencyLayout"
import { RootLayout } from "@/layouts/RootLayout"

// Admin routes
import AdminDashboardPage from "@/pages/admin/DashboardPage"
import AdminAuthPage from "@/pages/admin/AuthPage"
import AdminAgenciesPage from "@/pages/admin/AgenciesPage"
import AdminCreateAgencyPage from "@/pages/admin/CreateAgencyPage"
import AdminEditAgencyPage from "@/pages/admin/EditAgencyPage"
import AdminUsersPage from "@/pages/admin/UsersPage"
import AdminSettingsPage from "@/pages/admin/SettingsPage"
import AdminRegistrationRequestsPage from "@/pages/admin/RegistrationRequestsPage"
import AdminRegistrationRequestDetailPage from "@/pages/admin/RegistrationRequestDetailPage"

// Agency routes
import AgencyHomePage from "@/pages/agency/HomePage"
import AgencyAuthPage from "@/pages/agency/AuthPage"
import AgencyRegisterPage from "@/pages/agency/RegisterPage"
import AgencyDashboardPage from "@/pages/agency/DashboardPage"
import AgencyPropertiesPage from "@/pages/agency/PropertiesPage"
import AgencyPropertyDetailPage from "@/pages/agency/PropertyDetailPage"
import AgencyPropertyImagesPage from "@/pages/agency/PropertyImagesPage"
import AgencyAgentsPage from "@/pages/agency/AgentsPage"
import AgencySettingsPage from "@/pages/agency/SettingsPage"

// Agent routes
import AgentDashboardPage from "@/pages/agency/agent/DashboardPage"
import AgentPropertiesPage from "@/pages/agency/agent/PropertiesPage"
import AgentAppointmentsPage from "@/pages/agency/agent/AppointmentsPage"

// Client routes
import ClientDashboardPage from "@/pages/agency/client/DashboardPage"
import ClientAppointmentsPage from "@/pages/agency/client/AppointmentsPage"
import ClientFavoritesPage from "@/pages/agency/client/FavoritesPage"

export function Routes() {
  return (
    <RouterRoutes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        
        {/* Admin routes */}
        <Route path="admin" element={<AdminLayout />}>
          <Route path="auth" element={<AdminAuthPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="agencies" element={<AdminAgenciesPage />} />
          <Route path="agencies/create" element={<AdminCreateAgencyPage />} />
          <Route path="agencies/:id/edit" element={<AdminEditAgencyPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="registration-requests" element={<AdminRegistrationRequestsPage />} />
          <Route path="registration-requests/:id" element={<AdminRegistrationRequestDetailPage />} />
        </Route>

        {/* Agency routes */}
        <Route path=":slug" element={<AgencyLayout />}>
          <Route index element={<AgencyHomePage />} />
          <Route path="auth" element={<AgencyAuthPage />} />
          <Route path="register" element={<AgencyRegisterPage />} />
          <Route path="dashboard" element={<AgencyDashboardPage />} />
          <Route path="properties" element={<AgencyPropertiesPage />} />
          <Route path="properties/:id" element={<AgencyPropertyDetailPage />} />
          <Route path="properties/:id/images" element={<AgencyPropertyImagesPage />} />
          <Route path="agents" element={<AgencyAgentsPage />} />
          <Route path="settings" element={<AgencySettingsPage />} />

          {/* Agent routes */}
          <Route path="agent">
            <Route path="dashboard" element={<AgentDashboardPage />} />
            <Route path="properties" element={<AgentPropertiesPage />} />
            <Route path="appointments" element={<AgentAppointmentsPage />} />
          </Route>

          {/* Client routes */}
          <Route path="client">
            <Route path="dashboard" element={<ClientDashboardPage />} />
            <Route path="appointments" element={<ClientAppointmentsPage />} />
            <Route path="favorites" element={<ClientFavoritesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </RouterRoutes>
  )
}