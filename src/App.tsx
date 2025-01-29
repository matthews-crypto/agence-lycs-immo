import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import RootLayout from "@/layouts/RootLayout"
import AdminLayout from "@/layouts/AdminLayout"
import AgencyLayout from "@/layouts/AgencyLayout"
import IndexPage from "@/pages/IndexPage"
import NotFoundPage from "@/pages/NotFoundPage"
import AdminLoginPage from "@/pages/admin/LoginPage"
import AdminDashboardPage from "@/pages/admin/DashboardPage"
import AdminAgenciesPage from "@/pages/admin/AgenciesPage"
import AdminUsersPage from "@/pages/admin/UsersPage"
import AdminSettingsPage from "@/pages/admin/SettingsPage"
import CreateAgencyPage from "@/pages/admin/CreateAgencyPage"
import EditAgencyPage from "@/pages/admin/EditAgencyPage"
import AgencyDashboardPage from "@/pages/agency/DashboardPage"
import AgencyLoginPage from "@/pages/agency/LoginPage"
import AgencyHomePage from "@/pages/agency/HomePage"
import SettingsPage from "@/pages/agency/SettingsPage"
import { AgencyProvider } from "@/contexts/AgencyContext"

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <IndexPage />,
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          {
            path: "auth",
            element: <AdminLoginPage />,
          },
          {
            path: "dashboard",
            element: <AdminDashboardPage />,
          },
          {
            path: "agencies",
            element: <AdminAgenciesPage />,
          },
          {
            path: "agencies/create",
            element: <CreateAgencyPage />,
          },
          {
            path: "agencies/:id/edit",
            element: <EditAgencyPage />,
          },
          {
            path: "users",
            element: <AdminUsersPage />,
          },
          {
            path: "settings",
            element: <AdminSettingsPage />,
          },
        ],
      },
      {
        path: ":agencySlug",
        element: (
          <AgencyProvider>
            <RootLayout />
          </AgencyProvider>
        ),
        children: [
          {
            index: true,
            element: <AgencyHomePage />,
          },
          {
            path: "auth",
            element: <AgencyLoginPage />,
          },
        ],
      },
      {
        path: ":agencySlug/agency",
        element: (
          <AgencyProvider>
            <AgencyLayout />
          </AgencyProvider>
        ),
        children: [
          {
            path: "dashboard",
            element: <AgencyDashboardPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
