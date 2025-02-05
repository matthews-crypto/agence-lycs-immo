import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AgencyProvider } from "@/contexts/AgencyContext";
import { AuthProvider } from "@/contexts/AuthContext";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AgencyLayout from "@/pages/agency/AgencyLayout";
import AgencyDashboardPage from "@/pages/agency/AgencyDashboardPage";
import AgencyPropertiesPage from "@/pages/agency/AgencyPropertiesPage";
import AgencyClientsPage from "@/pages/agency/AgencyClientsPage";
import AgencyAppointmentsPage from "@/pages/agency/AgencyAppointmentsPage";
import AgencySettingsPage from "@/pages/agency/AgencySettingsPage";
import AgencyPropertyDetailPage from "@/pages/agency/PropertyDetailPage";
import PropertyDetailPublicPage from "@/pages/PropertyDetailPublicPage";
import AgencyPropertyImagesPage from "@/pages/agency/PropertyImagesPage";
import AgencyPropertyCreatePage from "@/pages/agency/PropertyCreatePage";
import AgencyPropertyEditPage from "@/pages/agency/PropertyEditPage";
import AgencyClientDetailPage from "@/pages/agency/ClientDetailPage";
import AgencyClientCreatePage from "@/pages/agency/ClientCreatePage";
import AgencyClientEditPage from "@/pages/agency/ClientEditPage";
import AgencyAppointmentDetailPage from "@/pages/agency/AppointmentDetailPage";
import AgencyAppointmentCreatePage from "@/pages/agency/AppointmentCreatePage";
import AgencyAppointmentEditPage from "@/pages/agency/AppointmentEditPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminAgenciesPage from "@/pages/admin/AdminAgenciesPage";
import AdminAgencyDetailPage from "@/pages/admin/AdminAgencyDetailPage";
import AdminAgencyCreatePage from "@/pages/admin/AdminAgencyCreatePage";
import AdminAgencyEditPage from "@/pages/admin/AdminAgencyEditPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminRegistrationsPage from "@/pages/admin/AdminRegistrationsPage";
import AdminRegistrationDetailPage from "@/pages/admin/AdminRegistrationDetailPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Public Property Routes */}
              <Route path="/:agencySlug/properties/:propertyId" element={<PropertyDetailPublicPage />} />

              {/* Agency Routes */}
              <Route path="/:agencySlug/agency" element={<AgencyLayout />}>
                <Route index element={<AgencyDashboardPage />} />
                <Route path="properties" element={<AgencyPropertiesPage />} />
                <Route path="properties/create" element={<AgencyPropertyCreatePage />} />
                <Route path="properties/:propertyId" element={<AgencyPropertyDetailPage />} />
                <Route path="properties/:propertyId/edit" element={<AgencyPropertyEditPage />} />
                <Route path="properties/:propertyId/images" element={<AgencyPropertyImagesPage />} />
                <Route path="clients" element={<AgencyClientsPage />} />
                <Route path="clients/create" element={<AgencyClientCreatePage />} />
                <Route path="clients/:clientId" element={<AgencyClientDetailPage />} />
                <Route path="clients/:clientId/edit" element={<AgencyClientEditPage />} />
                <Route path="appointments" element={<AgencyAppointmentsPage />} />
                <Route path="appointments/create" element={<AgencyAppointmentCreatePage />} />
                <Route path="appointments/:appointmentId" element={<AgencyAppointmentDetailPage />} />
                <Route path="appointments/:appointmentId/edit" element={<AgencyAppointmentEditPage />} />
                <Route path="settings" element={<AgencySettingsPage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="agencies" element={<AdminAgenciesPage />} />
                <Route path="agencies/create" element={<AdminAgencyCreatePage />} />
                <Route path="agencies/:agencyId" element={<AdminAgencyDetailPage />} />
                <Route path="agencies/:agencyId/edit" element={<AdminAgencyEditPage />} />
                <Route path="registrations" element={<AdminRegistrationsPage />} />
                <Route path="registrations/:registrationId" element={<AdminRegistrationDetailPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
