import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { HelmetProvider } from 'react-helmet-async'
import RootLayout from "@/layouts/RootLayout"
import AdminLayout from "@/layouts/AdminLayout"
import AgencyLayout from "@/layouts/AgencyLayout"
import { AgencyProvider } from "@/contexts/AgencyContext"
import { LoadingLayout } from "@/components/LoadingLayout"

// Pages
import HomePage from "@/pages/HomePage"
import AdminAuthPage from "@/pages/admin/AuthPage"
import AdminDashboardPage from "@/pages/admin/DashboardPage"
import AdminAgenciesPage from "@/pages/admin/AgenciesPage"
import AdminSettingsPage from "@/pages/admin/SettingsPage"
import CreateAgencyPage from "@/pages/admin/CreateAgencyPage"
import EditAgencyPage from "@/pages/admin/EditAgencyPage"
import RegistrationRequestsPage from "@/pages/admin/RegistrationRequestsPage"
import RegistrationRequestDetailPage from "@/pages/admin/RegistrationRequestDetailPage"
import AgencyAuthPage from "@/pages/agency/AuthPage"
import AgencyHomePage from "@/pages/agency/HomePage"
import AgencyPropertiesPage from "@/pages/agency/PropertiesPage"
import AgencyPropertyDetailPage from "@/pages/agency/PropertyDetailPage"
import PublicPropertyDetailPage from "@/pages/agency/PublicPropertyDetailPage"
import PropertyImagesPage from "@/pages/agency/PropertyImagesPage"
import AgencyRegisterPage from "@/pages/agency/RegisterPage"
import AgencyDashboardPage from "@/pages/agency/DashboardPage"
import AgencyAgentsPage from "@/pages/agency/AgentsPage"
import AgencySettingsPage from "@/pages/agency/SettingsPage"
import AgentDashboardPage from "@/pages/agency/agent/DashboardPage"
import AgentPropertiesPage from "@/pages/agency/agent/PropertiesPage"
import AgentAppointmentsPage from "@/pages/agency/agent/AppointmentsPage"
import ClientDashboardPage from "@/pages/agency/client/DashboardPage"
import ClientFavoritesPage from "@/pages/agency/client/FavoritesPage"
import ClientAppointmentsPage from "@/pages/agency/client/AppointmentsPage"
import NotFoundPage from "@/pages/NotFoundPage"
import UsersPage from "@/pages/admin/UsersPage"

const queryClient = new QueryClient()

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              {/* Public routes */}
              <Route index element={<HomePage />} />
              <Route path="404" element={<NotFoundPage />} />

              {/* Admin routes */}
              <Route path="admin/auth" element={<AdminAuthPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="agencies" element={<AdminAgenciesPage />} />
                <Route path="agencies/create" element={<CreateAgencyPage />} />
                <Route path="agencies/:id/edit" element={<EditAgencyPage />} />
                <Route path="registration-requests" element={<RegistrationRequestsPage />} />
                <Route path="registration-requests/:id" element={<RegistrationRequestDetailPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Agency routes */}
              <Route
                path=":agencySlug"
                element={
                  <AgencyProvider>
                    <AgencyLayout />
                  </AgencyProvider>
                }
              >
                {/* Public agency routes */}
                <Route index element={<AgencyHomePage />} />
                <Route path="auth" element={<AgencyAuthPage />} />
                <Route path="properties" element={<AgencyPropertiesPage />} />
                <Route
                  path="properties/:propertyId"
                  element={<AgencyPropertyDetailPage />}
                />
                <Route
                  path="properties/:propertyId/public"
                  element={<PublicPropertyDetailPage />}
                />
                <Route
                  path="properties/:propertyId/images"
                  element={<PropertyImagesPage />}
                />
                <Route path="register" element={<AgencyRegisterPage />} />

                {/* Agency admin routes */}
                <Route path="agency">
                  <Route
                    index
                    element={<Navigate to="dashboard" replace />}
                  />
                  <Route path="dashboard" element={<AgencyDashboardPage />} />
                  <Route path="agents" element={<AgencyAgentsPage />} />
                  <Route path="settings" element={<AgencySettingsPage />} />
                  <Route
                    path="properties"
                    element={<AgencyPropertiesPage />}
                  />
                </Route>

                {/* Agent routes */}
                <Route path="agent">
                  <Route
                    index
                    element={<Navigate to="dashboard" replace />}
                  />
                  <Route path="dashboard" element={<AgentDashboardPage />} />
                  <Route
                    path="properties"
                    element={<AgentPropertiesPage />}
                  />
                  <Route
                    path="appointments"
                    element={<AgentAppointmentsPage />}
                  />
                </Route>

                {/* Client routes */}
                <Route path="client">
                  <Route
                    index
                    element={<Navigate to="dashboard" replace />}
                  />
                  <Route
                    path="dashboard"
                    element={<ClientDashboardPage />}
                  />
                  <Route
                    path="favorites"
                    element={<ClientFavoritesPage />}
                  />
                  <Route
                    path="appointments"
                    element={<ClientAppointmentsPage />}
                  />
                </Route>
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
)

export default App
