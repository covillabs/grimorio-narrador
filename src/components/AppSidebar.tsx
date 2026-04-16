import { Users, Ghost, Swords, MapPin, BookOpen, ScrollText, Network, ShieldAlert } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Escudo do Narrador", url: "/escudo", icon: ShieldAlert },
  { title: "A Coterie", url: "/", icon: Users },
  { title: "Galeria de NPCs", url: "/npcs", icon: Ghost },
  { title: "Teia de Intrigas", url: "/teia", icon: Network },
  { title: "Arsenal", url: "/arsenal", icon: Swords },
  { title: "Atlas Sombrio", url: "/atlas", icon: MapPin },
  { title: "Ocultismo", url: "/ocultismo", icon: BookOpen },
  { title: "Diário da Crônica", url: "/diario", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 border-b border-border">
        {!collapsed ? (
          <h1 className="text-lg font-serif font-bold text-primary tracking-wider">
            Grimório do Narrador
          </h1>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-serif font-bold text-sm">G</span>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-primary/15 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
