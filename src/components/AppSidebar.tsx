import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Users, LogOut, Bot, Key, Presentation, Search, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserRole } from "@/hooks/useUserRole";
import { useViewMode } from "@/contexts/ViewModeContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigationItems = [
  { 
    title: "Hotéis", 
    url: "/dashboard", 
    icon: Building2,
    adminOnly: false 
  },
  { 
    title: "Agentes", 
    url: "/settings/agents", 
    icon: Bot,
    adminOnly: true 
  },
  { 
    title: "API Keys", 
    url: "/settings/api-keys", 
    icon: Key,
    adminOnly: true 
  },
  { 
    title: "Gamma", 
    url: "/settings/gamma", 
    icon: Presentation,
    adminOnly: true 
  },
  { 
    title: "Pesquisa", 
    url: "/settings/research", 
    icon: Search,
    adminOnly: true 
  },
  { 
    title: "Usuários", 
    url: "/users", 
    icon: Users,
    adminOnly: true 
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isRealAdmin } = useUserRole();
  const { isViewingAsUser, toggleViewMode } = useViewMode();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredItems = navigationItems.filter(
    item => !item.adminOnly || isAdmin
  );

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname.startsWith("/hotel");
    }
    return location.pathname === url;
  };

  return (
    <Sidebar 
      className="border-r border-sidebar-border"
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center transition-all duration-200",
          isCollapsed ? "justify-center" : "justify-start"
        )}>
          {isCollapsed ? (
            <div className="w-8 h-8 gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">R</span>
            </div>
          ) : (
            <Logo />
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "h-10 transition-colors",
                        active 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground" 
                          : "hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          {isRealAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleViewMode}
                tooltip={isViewingAsUser ? "Ver como Admin" : "Ver como Usuário"}
                className={cn(
                  "h-10 transition-colors",
                  isViewingAsUser 
                    ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                {isViewingAsUser ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{isViewingAsUser ? "Ver como Admin" : "Ver como Usuário"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sair"
              className="h-10 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
