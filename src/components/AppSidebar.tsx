import { Users, Ghost, Swords, MapPin, BookOpen, ScrollText, Network, ShieldAlert, Home, Target, Scale, Database, DownloadCloud, UploadCloud } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useRef } from "react";
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
  { title: "Home", url: "/", icon: Home },
  { title: "Escudo do Narrador", url: "/escudo", icon: ShieldAlert },
  { title: "Arena de Sangue", url: "/combate", icon: Swords },
  { title: "A Coterie", url: "/coterie", icon: Users },
  { title: "Tramas e Contratos", url: "/quests", icon: Target },
  { title: "Galeria de NPCs", url: "/npcs", icon: Ghost },
  { title: "Teia de Intrigas", url: "/teia", icon: Network },
  { title: "Arsenal", url: "/arsenal", icon: Swords },
  { title: "Atlas Sombrio", url: "/atlas", icon: MapPin },
  { title: "Ocultismo", url: "/ocultismo", icon: BookOpen },
  { title: "Diário da Crônica", url: "/diario", icon: ScrollText },
  { title: "Livro de Dívidas", url: "/boons", icon: Scale },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    const backupData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("v5_")) {
        backupData[key] = localStorage.getItem(key) || "";
      }
    }
    
    if (Object.keys(backupData).length === 0) {
      toast.error("Nenhum dado de crônica encontrado para exportar.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "grimorio_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Backup do Grimório exportado com sucesso!");
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        let importedCount = 0;
        Object.keys(backupData).forEach(key => {
          if (key.startsWith("v5_")) {
            localStorage.setItem(key, backupData[key]);
            importedCount++;
          }
        });
        
        if (importedCount > 0) {
          toast.success("Sangue Antigo restaurado! Recarregando grimório...");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.error("Arquivo inválido. Nenhum registro V5 encontrado.");
        }
      } catch (error) {
        toast.error("Ocorreu um erro ao decifrar o tomo. Arquivo corrompido.");
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

      <div className="p-4 border-t border-border bg-background/50">
        {!collapsed ? (
          <div className="flex flex-col space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Database className="w-3 h-3" /> Memória Local
            </h3>
            <button 
              onClick={handleExportBackup}
              className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors p-2 hover:bg-muted/50 rounded"
            >
              <DownloadCloud className="w-4 h-4" /> Exportar Backup (Json)
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors p-2 hover:bg-muted/50 rounded"
            >
              <UploadCloud className="w-4 h-4" /> Restaurar Grimório
            </button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImportBackup} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <button onClick={handleExportBackup} title="Exportar Backup" className="text-muted-foreground hover:text-primary">
              <DownloadCloud className="w-5 h-5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Restaurar Grimório" className="text-muted-foreground hover:text-primary">
              <UploadCloud className="w-5 h-5" />
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportBackup} />
          </div>
        )}
      </div>

    </Sidebar>
  );
}
