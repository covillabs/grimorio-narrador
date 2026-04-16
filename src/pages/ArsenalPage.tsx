import { useState } from "react";
import { Plus, Crosshair, Sparkles, ScrollText, UserSearch, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["Arma", "Ferramenta", "Artefato", "Documento"];

export default function ArsenalPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [mockItems] = useState([
    {
      id: "1",
      name: "MAC-10 Silenciada (Fósforo)",
      category: "Arma",
      owner: "Kaleb (Coterie)",
      modifier: "Dano +3 (Agravado em Vampiros)",
      image_url: "https://images.unsplash.com/photo-1595590424283-b8f1784cb2c6?q=80&w=600&auto=format&fit=crop",
      description: "Submetralhadora compacta altamente ilegal, modificada com um supressor caseiro. Os pentes atuais estão carregados com munição incendiária (Fósforo Branco), letal contra Membros da Família.",
      mechanical_details: "Rolagem: Destreza + Armas de Fogo. Causa dano Agravado não reduzível por Fortitude comum. Risco extremo à Máscara pelo clarão."
    },
    {
      id: "2",
      name: "Cálice de Gelo Sangrento",
      category: "Artefato",
      owner: "Príncipe Sebastian",
      modifier: "Potência de Sangue +1 (Temporário)",
      image_url: "https://images.unsplash.com/photo-1574512214488-842261e469bb?q=80&w=600&auto=format&fit=crop",
      description: "Uma relíquia de taça Tremere roubada nos anos 90. O sangue contido ali nunca coagula e permanece com o gosto do momento da Morte.",
      mechanical_details: "Ritual: Beber vitae plena deste cálice aumenta a Potência de Sangue do usuário em 1 ponto pela noite inteira, ao custo de 1 ponto de Fome permanente na noite seguinte."
    },
    {
      id: "3",
      name: "Dossiê Projeto Crepúsculo",
      category: "Documento",
      owner: "Lucien (Coterie)",
      modifier: "Bônus +2 em Investigação",
      image_url: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?q=80&w=600&auto=format&fit=crop",
      description: "Uma pasta grossa interceptada de um agente falecido da Segunda Inquisição. Possui fotos granuladas de reuniões do Elysium e algumas rotas de patrulha humana.",
      mechanical_details: "Fornece Dados Bônus (+2) em qualquer rolagem de Política ou Investigação para prever movimentos da Segunda Inquisição. Pode comprometer portadores se descoberto."
    }
  ]);

  const items = mockItems;
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Arsenal & Relíquias</h1>
          <p className="text-muted-foreground mt-1">Armamentos, artefatos e documentos vitais da Crônica</p>
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
                <div className="flex items-center gap-2">
                  <UserSearch className="w-4 h-4 text-primary opacity-80" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Em Posse Atual de</span>
                    <span className="text-xs font-semibold text-foreground">{item.owner}</span>
                  </div>
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
