import { Users, Ghost, Swords, MapPin, BookOpen, ScrollText, Network, ShieldAlert, Home, Target, Scale, Database, DownloadCloud, UploadCloud, Sparkles, Package } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const sectionCentral = [
  { title: "Home", url: "/", icon: Home },
];

const sectionMesa = [
  { title: "Escudo do Narrador", url: "/escudo", icon: ShieldAlert },
  { title: "Arena de Sangue", url: "/combate", icon: Swords },
  { title: "Diário da Crônica", url: "/diario", icon: ScrollText },
];

const sectionCronica = [
  { title: "A Coterie", url: "/coterie", icon: Users },
  { title: "Galeria de NPCs", url: "/npcs", icon: Ghost },
  { title: "Teia de Intrigas", url: "/teia", icon: Network },
  { title: "Tramas e Contratos", url: "/quests", icon: Target },
  { title: "Livro de Dívidas", url: "/boons", icon: Scale },
];

const sectionMundo = [
  { title: "Arsenal", url: "/arsenal", icon: Package },
  { title: "Atlas Sombrio", url: "/atlas", icon: MapPin },
  { title: "Ocultismo", url: "/ocultismo", icon: BookOpen },
  { title: "Oráculo de Lore", url: "/oracle", icon: Sparkles },
];

function MenuSection({ items, collapsed }: { items: typeof sectionCentral; collapsed: boolean }) {
  return (
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
  );
}

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
        {/* Central */}
        <SidebarGroup>
          <SidebarGroupContent>
            <MenuSection items={sectionCentral} collapsed={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mesa de Jogo */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 px-3">Mesa de Jogo</SidebarGroupLabel>}
          <SidebarGroupContent>
            <MenuSection items={sectionMesa} collapsed={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Crônica */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 px-3">Crônica</SidebarGroupLabel>}
          <SidebarGroupContent>
            <MenuSection items={sectionCronica} collapsed={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Mundo */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 px-3">Mundo</SidebarGroupLabel>}
          <SidebarGroupContent>
            <MenuSection items={sectionMundo} collapsed={collapsed} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
