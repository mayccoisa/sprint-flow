import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Squads from "./pages/Squads";
import SquadMembers from "./pages/SquadMembers";
import Team from "./pages/Team";
import UsersManagement from "./pages/UsersManagement"; // Added
import Login from "./pages/Login"; // Added
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
import DocumentationHub from "./pages/DocumentationHub";
import DocumentEditor from "./pages/DocumentEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <Toaster />

          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

              <Route path="/squads" element={<ProtectedRoute feature="squads"><Squads /></ProtectedRoute>} />
              <Route path="/squads/:id/members" element={<ProtectedRoute feature="squads"><SquadMembers /></ProtectedRoute>} />

              <Route path="/team" element={<ProtectedRoute feature="squads"><Team /></ProtectedRoute>} />

              <Route path="/initiatives" element={<ProtectedRoute feature="initiatives"><InitiativesOverview /></ProtectedRoute>} />

              <Route path="/product-backlog" element={<ProtectedRoute feature="backlog"><ProductBacklog /></ProtectedRoute>} />
              <Route path="/engineering-backlog" element={<ProtectedRoute feature="backlog"><Backlog /></ProtectedRoute>} />
              {/* Legacy route alias */}
              <Route path="/backlog" element={<ProtectedRoute feature="backlog"><Backlog /></ProtectedRoute>} />

              <Route path="/product-strategy" element={<ProtectedRoute feature="strategy"><ProductStrategy /></ProtectedRoute>} />
              <Route path="/product-modules" element={<ProtectedRoute feature="strategy"><ProductModules /></ProtectedRoute>} />

              <Route path="/sprints" element={<ProtectedRoute feature="sprints"><Sprints /></ProtectedRoute>} />
              <Route path="/sprints/:id/planning" element={<ProtectedRoute feature="sprints"><SprintPlanning /></ProtectedRoute>} />
              <Route path="/sprints/:id/summary" element={<ProtectedRoute feature="sprints"><SprintSummary /></ProtectedRoute>} />

              <Route path="/calendar" element={<ProtectedRoute feature="sprints"><Calendar /></ProtectedRoute>} />

              <Route path="/releases" element={<ProtectedRoute feature="releases"><Releases /></ProtectedRoute>} />
              <Route path="/releases/:id" element={<ProtectedRoute feature="releases"><ReleaseDetail /></ProtectedRoute>} />

              <Route path="/docs" element={<ProtectedRoute feature="documents"><DocumentationHub /></ProtectedRoute>} />
              <Route path="/docs/:id" element={<ProtectedRoute feature="documents"><DocumentEditor /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/users" element={<ProtectedRoute requiredRole="Admin"><UsersManagement /></ProtectedRoute>} />
              <Route path="/admin/seed-data" element={<ProtectedRoute requiredRole="Admin"><SeedData /></ProtectedRoute>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
