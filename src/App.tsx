import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { HelmetProvider } from 'react-helmet-async'
import RootLayout from "@/layouts/RootLayout"
import AdminLayout from "@/layouts/AdminLayout"
import AgencyLayout from "@/layouts/AgencyLayout"
import AgentLayout from "@/layouts/AgentLayout"
import ClientLayout from "@/layouts/ClientLayout"
import ImmoLayout from "@/layouts/ImmoLayout"
import LocativeLayout from "@/layouts/LocativeLayout"
import CoproLayout from "@/layouts/CoproLayout"
import { AgencyProvider } from "@/contexts/AgencyContext"

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
import AgencyProspectionPage from "@/pages/agency/ProspectionPage"
import AppointmentsPage from "@/pages/agency/AppointmentsPage"
import AgentDashboardPage from "@/pages/agency/agent/DashboardPage"
import AgentPropertiesPage from "@/pages/agency/agent/PropertiesPage"
import AgentAppointmentsPage from "@/pages/agency/agent/AppointmentsPage"
import ClientDashboardPage from "@/pages/agency/client/DashboardPage"
import ClientFavoritesPage from "@/pages/agency/client/FavoritesPage"
import ClientAppointmentsPage from "@/pages/agency/client/AppointmentsPage"
import NotFoundPage from "@/pages/NotFoundPage"
import UsersPage from "@/pages/admin/UsersPage"
import ClientsPage from "@/pages/agency/ClientsPage"
import PlanningPage from "@/pages/agency/PlanningPage"
import LocationDetailPage from "@/pages/agency/LocationDetailPage"
import ProprietairesPage from "@/pages/agency/ProprietairesPage"
import PaymentsPage from "@/pages/agency/PaymentsPage"
import PaymentDetailsPage from "@/pages/agency/PaymentDetailsPage"
import CoproprieteePage from "@/pages/agency/CoproprieteePage"
import AppelDeFondPage from "@/pages/agency/AppelDeFondPage"
import AppelDeFondDetailPage from "@/pages/agency/AppelDeFondDetailPage"
import SalesPage from "@/pages/agency/SalesPage"
import ResetPasswordPage from "@/pages/agency/ResetPasswordPage"
import ContractEditorPage from "@/pages/agency/ContractEditorPage"
import ContactRequestsPage from "@/pages/agency/ContactRequestsPage"
import ServicesPage from "@/pages/agency/ServicesPage"
import ImmoDashboardPage from "@/pages/immo/DashboardPage"
import LocativeDashboardPage from "@/pages/locative/DashboardPage"
import CoproDashboardPage from "@/pages/copro/DashboardPage"
import ServiceDetailsPage from "@/pages/services/ServiceDetailsPage"

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
              <Route path="/services/gestion-immobiliere" element={<ServiceDetailsPage />} />
              <Route path="/services/gestion-copropriete" element={<ServiceDetailsPage />} />
              <Route path="/services/gestion-locative" element={<ServiceDetailsPage />} />
              <Route path="/services/bot-whatsapp" element={<ServiceDetailsPage />} />
              <Route path="404" element={<NotFoundPage />} />

              {/* Admin routes */}
              <Route path="admin/auth" element={<AdminAuthPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="services" replace />} />
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
                <Route index element={<AgencyHomePage />} />
                <Route path="auth" element={<AgencyAuthPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
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
                
                {/* Nouvelles routes pour les différentes applications */}
                <Route path="immo" element={<ImmoLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<ImmoDashboardPage />} />
                  <Route path="properties" element={<AgencyPropertiesPage />} />
                  <Route path="prospection" element={<AgencyProspectionPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="contact-requests" element={<ContactRequestsPage />} />
                </Route>
                
                <Route path="locative" element={<LocativeLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<LocativeDashboardPage />} />
                  <Route path="planning" element={<PlanningPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="sales" element={<SalesPage />} />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="proprietaires" element={<ProprietairesPage />} />
                </Route>
                
                <Route path="copro" element={<CoproLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<CoproDashboardPage />} />
                  <Route path="lots" element={<CoproprieteePage />} />
                  <Route path="appel-de-fond" element={<AppelDeFondPage />} />
                </Route>

                {/* Agency admin routes */}
                <Route path="agency">
                  <Route
                    index
                    element={<Navigate to="services" replace />}
                  />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="dashboard" element={<AgencyDashboardPage />} />
                  <Route path="agents" element={<AgencyAgentsPage />} />
                  <Route path="prospection" element={<AgencyProspectionPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="planning" element={<PlanningPage />} />
                  <Route path="planning/:locationId" element={<LocationDetailPage />} />
                  <Route path="sales" element={<SalesPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/:locationId" element={<PaymentDetailsPage />} />
                  <Route path="settings" element={<AgencySettingsPage />} />
                  <Route path="contract-editor" element={<ContractEditorPage />} />
                  <Route
                    path="properties"
                    element={<AgencyPropertiesPage />}
                  />
                  <Route path="clients" element={<ClientsPage />} />
                  <Route path="proprietaires" element={<ProprietairesPage />} />
                  <Route path="copropriete" element={<CoproprieteePage />} />
                  <Route path="appel-de-fond" element={<AppelDeFondPage />} />
                  <Route path="appel-de-fond/:id" element={<AppelDeFondDetailPage />} />
                  <Route path="contact-requests" element={<ContactRequestsPage />} />
                </Route>

                {/* Agent routes */}
                <Route path="agent">
                  <Route
                    index
                    element={<Navigate to="services" replace />}
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
                    element={<Navigate to="services" replace />}
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
