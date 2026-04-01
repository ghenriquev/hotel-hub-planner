import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AppLayout } from "@/components/AppLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewHotel from "./pages/NewHotel";
import HotelDetail from "./pages/HotelDetail";
import AgentModule from "./pages/AgentModule";
import ClientView from "./pages/ClientView";
import Evidences from "./pages/Evidences";
import SettingsAgents from "./pages/SettingsAgents";
import SettingsApiKeys from "./pages/SettingsApiKeys";
import SettingsGamma from "./pages/SettingsGamma";
import SettingsResearch from "./pages/SettingsResearch";
import UserManagement from "./pages/UserManagement";
import ManualForm from "./pages/ManualForm";
import ManualResponses from "./pages/ManualResponses";
import SettingsManualTemplate from "./pages/SettingsManualTemplate";
import PublicClientView from "./pages/PublicClientView";
import Phase34Deliverables from "./pages/Phase34Deliverables";
import StrategicSummary from "./pages/StrategicSummary";
import FinalReport from "./pages/FinalReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }
  
  if (!session) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }
  
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <ViewModeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hotel/new" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <NewHotel />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hotel/:id" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <HotelDetail />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hotel/:id/module/:moduleId" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <AgentModule />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hotel/:id/client-view" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ClientView />
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/hotel/:id/evidences" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <Evidences />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/agents" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <SettingsAgents />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/api-keys" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <SettingsApiKeys />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/gamma" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <SettingsGamma />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/research" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <SettingsResearch />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings/manual-template" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <SettingsManualTemplate />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hotel/:hotelId/manual-responses" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout>
                      <ManualResponses />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />
            {/* Public Manual Form Route */}
            <Route path="/manual/:hotelId/:token" element={<ManualForm />} />
            {/* Public Client View Route */}
            <Route path="/v/:slug" element={<PublicClientView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ViewModeProvider>
);

export default App;
