import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AgencyProvider } from "@/contexts/AgencyContext";

import HomePage from "@/pages/HomePage";
import PropertyDetailPublicPage from "@/pages/PropertyDetailPublicPage";
import NotFoundPage from "@/pages/NotFoundPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
          <AgencyProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/:agencySlug/properties/:propertyId" element={<PropertyDetailPublicPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AgencyProvider>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;