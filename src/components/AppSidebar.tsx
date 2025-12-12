import { useNavigate, useLocation } from "react-router-dom";
import { Building2, Settings, Users, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserRole } from "@/hooks/useUserRole";
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
    title: "Configurações", 
    url: "/settings", 
    icon: Settings,
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
  const { isAdmin } = useUserRole();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredItems = navigationItems.filter(
    item => !item.adminOnly || isAdmin
  );

  return (
    <Sidebar 
      className="border-r-0"
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
                const isActive = location.pathname === item.url || 
                  (item.url === "/dashboard" && location.pathname.startsWith("/hotel"));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "h-10 transition-colors",
                        isActive 
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
