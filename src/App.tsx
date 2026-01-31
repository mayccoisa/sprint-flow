import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Squads from "./pages/Squads";
import SquadMembers from "./pages/SquadMembers";
import Team from "./pages/Team";
import Backlog from "./pages/Backlog";
import ProductBacklog from "./pages/ProductBacklog";
import InitiativesOverview from "./pages/InitiativesOverview";
import ProductStrategy from "./pages/ProductStrategy";
import { ProductModules } from "./pages/ProductModules";
import Sprints from "./pages/Sprints";
import SprintPlanning from "./pages/SprintPlanning";
import SprintSummary from "./pages/SprintSummary";
import Calendar from "./pages/Calendar";
import Releases from "./pages/Releases";
import ReleaseDetail from "./pages/ReleaseDetail";
import SeedData from "./pages/SeedData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />

        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/squads" element={<Squads />} />
            <Route path="/squads/:id/members" element={<SquadMembers />} />
            <Route path="/team" element={<Team />} />
            <Route path="/initiatives" element={<InitiativesOverview />} />
            <Route path="/product-backlog" element={<ProductBacklog />} />
            <Route path="/engineering-backlog" element={<Backlog />} />
            {/* Legacy route alias */}
            <Route path="/backlog" element={<Backlog />} />
            <Route path="/product-strategy" element={<ProductStrategy />} />
            <Route path="/product-modules" element={<ProductModules />} />
            <Route path="/sprints" element={<Sprints />} />
            <Route path="/sprints/:id/planning" element={<SprintPlanning />} />
            <Route path="/sprints/:id/summary" element={<SprintSummary />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/releases" element={<Releases />} />
            <Route path="/releases/:id" element={<ReleaseDetail />} />
            <Route path="/admin/seed-data" element={<SeedData />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
