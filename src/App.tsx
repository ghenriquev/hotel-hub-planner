import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewHotel from "./pages/NewHotel";
import HotelDetail from "./pages/HotelDetail";
import AgentModule from "./pages/AgentModule";
import Evidences from "./pages/Evidences";
import SettingsAgents from "./pages/SettingsAgents";
import SettingsApiKeys from "./pages/SettingsApiKeys";
import SettingsGamma from "./pages/SettingsGamma";
import SettingsResearch from "./pages/SettingsResearch";
import UserManagement from "./pages/UserManagement";
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
                <AppLayout>
                  <NewHotel />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HotelDetail />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/:id/module/:moduleId" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AgentModule />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/:id/evidences" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Evidences />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/agents" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsAgents />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/api-keys" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsApiKeys />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/gamma" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsGamma />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings/research" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SettingsResearch />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
