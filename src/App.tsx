import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewHotel from "./pages/NewHotel";
import HotelDetail from "./pages/HotelDetail";
import AgentModule from "./pages/AgentModule";
import Evidences from "./pages/Evidences";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  
  if (user) {
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
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/new" 
            element={
              <ProtectedRoute>
                <NewHotel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/:id" 
            element={
              <ProtectedRoute>
                <HotelDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/:id/module/:moduleId" 
            element={
              <ProtectedRoute>
                <AgentModule />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hotel/:id/evidences" 
            element={
              <ProtectedRoute>
                <Evidences />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
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
