import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Plus, Crosshair, Sparkles, ScrollText, UserSearch, AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["Arma", "Ferramenta", "Artefato", "Documento"];

export default function ArsenalPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [coterieNames, setCoterieNames] = useState<string[]>([]);

  const [items, setItems] = useCloudStorage<any[]>("v5_arsenal", []);

  useEffect(() => {
    const savedCoterie = localStorage.getItem("v5_coterie");
    if (savedCoterie) {
      const parsed = JSON.parse(savedCoterie);
      setCoterieNames(parsed.map((p: any) => p.character_name));
    } else {
      setCoterieNames(["Lucien (O Belo)", "Viktoria", "Kaleb"]);
    }
  }, []);

  const handleAssignOwner = (itemId: string, newOwner: string) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, owner: newOwner } : item));
    toast.success(`Artefato transferido para ${newOwner}`);
  };

  const filtered = items.filter((item) => categoryFilter === "all" || item.category === categoryFilter);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Arma": return <Crosshair className="w-3 h-3 mr-1" />;
      case "Artefato": return <Sparkles className="w-3 h-3 mr-1" />;
      case "Documento": return <ScrollText className="w-3 h-3 mr-1" />;
      default: return null;
    }
  };

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case "Arma": return "destructive";
      case "Artefato": return "default";
      case "Documento": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Crosshair className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Arsenal & Relíquias</h1>
            <p className="text-muted-foreground mt-1 text-sm">Armamentos, artefatos e documentos vitais da Crônica</p>
          </div>
        </div>
        <Button onClick={() => toast.info("Edição de inventário será liberada após integrar Supabase.")} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Objeto
        </Button>
      </div>

      <div className="mb-8 p-1 inline-flex bg-surface-container-high rounded-md border border-border">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px] border-none bg-transparent focus:ring-0">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group flex flex-col relative"
          >
            {/* Header Image */}
            <div className="h-48 bg-muted relative overflow-hidden">
              <img 
                src={item.image_url} 
                alt={item.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
              
              <div className="absolute top-3 left-3">
                <Badge variant={getBadgeVariant(item.category)} className="text-[10px] uppercase tracking-widest shadow-lg flex items-center">
                  {getCategoryIcon(item.category)}
                  {item.category}
                </Badge>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col space-y-4 relative -mt-6">
              
              <h3 className="font-serif font-bold text-xl tracking-wide">{item.name}</h3>

              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {item.description}
              </p>

              {/* Stats Box */}
              <div className="bg-surface-container-low border border-border/50 rounded p-3 space-y-3">
                
                {/* Mechanical Modifier */}
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blood mt-0.5 opacity-80" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Efeito Mecânico (V5)</span>
                    <span className="text-xs font-bold text-blood tracking-wide">{item.modifier}</span>
                    <p className="text-[10px] text-muted-foreground mt-1 hidden group-hover:block transition-all opacity-0 group-hover:opacity-100 animate-in fade-in">
                      {item.mechanical_details}
                    </p>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-border/40"></div>

                {/* Ownership */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserSearch className="w-4 h-4 text-primary opacity-80" />
                    <div>
                      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Em Posse Atual de</span>
                      <span className="text-xs font-semibold text-foreground">{item.owner}</span>
                    </div>
                  </div>
                  
                  {/* Select for Assignment */}
                  <Select value={item.owner} onValueChange={(val) => handleAssignOwner(item.id, val)}>
                    <SelectTrigger className="w-[110px] h-7 text-[10px] border-border bg-background">
                       <UserPlus className="w-3 h-3 mr-1" /> Reatribuir
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ninguém">Ninguém</SelectItem>
                      <SelectItem value="Príncipe Sebastian">Príncipe Sebastian</SelectItem>
                      <SelectItem value="Barão Zora">Barão Zora</SelectItem>
                      {coterieNames.map(name => (
                         <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </div>
            
            {/* Ambient edge glow effect */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 pointer-events-none rounded-lg transition-colors"></div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground font-serif">Nenhum artefato detectado nesta categoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
