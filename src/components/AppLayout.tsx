import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { MigrationNotice } from "@/components/MigrationNotice";

interface AppLayoutProps {
  children: ReactNode;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Hotéis",
  "/settings/agents": "Agentes",
  "/settings/api-keys": "API Keys",
  "/settings/gamma": "Gamma",
  "/settings/research": "Pesquisa",
  "/users": "Usuários",
  "/hotel/new": "Novo Hotel",
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const { isViewingAsUser } = useViewMode();
  const { isRealAdmin } = useUserRole();

  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        
        setUserName(profile?.name || user.email?.split('@')[0] || '');
      }
    };
    fetchUserName();
  }, []);

  const getPageTitle = () => {
    // Check exact matches first
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname];
    }
    
    // Check for hotel detail page
    if (location.pathname.match(/^\/hotel\/[^/]+$/)) {
      return "Detalhes do Hotel";
    }
    
    // Check for module page
    if (location.pathname.includes("/module/")) {
      return "Módulo Estratégico";
    }
    
    // Check for evidences page
    if (location.pathname.includes("/evidences")) {
      return "Evidências";
    }
    
    return "";
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          {/* View Mode Banner */}
          {isRealAdmin && isViewingAsUser && (
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center text-sm text-yellow-600">
              👁️ Visualizando como Usuário
            </div>
          )}

          {/* Top Header */}
          <header className="sticky top-0 z-40 h-14 border-b border-border bg-card flex items-center px-4 gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            
            <div className="flex-1">
              <h1 className="font-display text-lg text-foreground">
                {getPageTitle()}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Olá, <span className="text-foreground font-medium">{userName}</span>
              </span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
