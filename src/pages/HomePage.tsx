import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { BookOpen, Network, ShieldAlert, Sparkles, MapPin, ChevronRight, Skull, Pencil, Save, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  subtitle: "Vampire: The Masquerade",
  chronicleName: "Dança Macabra",
  quote: '"A Besta que habito não pertence à noite. Ela dita como a noite deve se comportar."',
  imageUrl: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=1600&auto=format&fit=crop",
  metaTitle: "Últimos Acontecimentos:",
  metaText: "A Coterie descobriu que o Príncipe Sebastian está usando o porto para encobrir caixões... A Inquisição tem um alerta no distrito.",
  trackers: [
    { id: 1, title: "Status de Fome", value: "CRÍTICO" },
    { id: 2, title: "Máscara", value: "AMEAÇADA" },
    { id: 3, title: "Próx. Sessão", value: "Sábado 20h" },
    { id: 4, title: "Nível de XP", value: "Baixo (15)" }
  ]
};

export default function HomePage() {
  const [isEditing, setIsEditing] = useState(false);
  
  const [settings, setSettings] = useCloudStorage("v5_homeSettings", DEFAULT_SETTINGS);

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Mundo salvo! As entidades notarão a diferença.");
  };

  const handleReset = () => {
    if (window.confirm("Deseja apagar sua customização e voltar para o layout Macabro padrão?")) {
      setSettings(DEFAULT_SETTINGS);
      toast.info("Layout restaurado ao padrão original.");
    }
  };

  const updateTracker = (id: number, field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      trackers: prev.trackers.map((t: any) => t.id === id ? { ...t, [field]: value } : t)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Por causa do LocalStorage, por favor use uma imagem de até 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSettings({ ...settings, imageUrl: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 relative pb-10">
      
      {/* Barra de Ferramentas de Edição no topo (dentro do fluxo para não cortar) */}
      <div className="flex justify-end gap-2 shrink-0">
        {isEditing ? (
          <>
            <Button variant="outline" size="sm" onClick={handleReset} className="border-destructive text-destructive hover:bg-destructive hover:text-white">
               <RefreshCw className="w-4 h-4 mr-2"/> Resetar
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-blood hover:bg-blood/80 text-white">
               <Save className="w-4 h-4 mr-2"/> Salvar Crônica
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="border-border text-muted-foreground hover:text-foreground">
             <Pencil className="w-4 h-4 mr-2"/> Personalizar Crônica
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="bg-blood/10 border border-blood/30 p-4 rounded-lg text-sm text-blood font-semibold flex items-center justify-center animate-pulse shrink-0">
          Cuidado Mestre, você está reescrevendo a realidade. (Modo de Edição Ativo)
        </div>
      )}

      {/* Hero Banner Supremo */}
      <div className="relative rounded-lg overflow-hidden h-64 md:h-80 shadow-2xl border border-blood/20 group">
        <img 
          src={settings.imageUrl} 
          alt="Crônica V5" 
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isEditing ? 'grayscale-0' : 'grayscale brightness-50 group-hover:grayscale-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        <div className="absolute inset-0 bg-blood/10 mix-blend-overlay pointer-events-none"></div>
        
        <div className="absolute bottom-0 left-0 p-8 w-full z-10 text-shadow-md">
          <div className="max-w-4xl space-y-2">
            {isEditing ? (
              <Input 
                value={settings.subtitle} 
                onChange={e => setSettings({...settings, subtitle: e.target.value})} 
                className="bg-background/80 border-blood/50 text-blood font-bold tracking-[0.3em] uppercase max-w-sm mt-2" 
              />
            ) : (
              <h2 className="text-blood text-sm font-bold tracking-[0.3em] uppercase mb-2">{settings.subtitle}</h2>
            )}

            {isEditing ? (
              <Input 
                value={settings.chronicleName} 
                onChange={e => setSettings({...settings, chronicleName: e.target.value})} 
                className="bg-background/80 border-border text-2xl md:text-4xl font-serif font-black text-white py-6"
                placeholder="Nome da Crônica..."
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-serif font-black text-white drop-shadow-2xl mb-4">{settings.chronicleName}</h1>
            )}

            {isEditing ? (
              <Input 
                 value={settings.quote} 
                 onChange={e => setSettings({...settings, quote: e.target.value})} 
                 className="bg-background/80 border-border text-muted-foreground font-serif italic py-5 w-full mt-2" 
              />
            ) : (
              <p className="text-muted-foreground/90 font-serif italic text-lg border-l-2 border-blood pl-4 bg-background/20 py-1 pr-2 rounded-r max-w-fit shadow-black drop-shadow-lg">
                {settings.quote}
              </p>
            )}

            {isEditing && (
              <div className="mt-4 bg-background/80 p-3 rounded border border-border flex flex-col space-y-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Foto de Fundo (Local ou URL):</span>
                <div className="flex gap-2">
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-muted text-xs flex-1 cursor-pointer file:text-blood file:font-semibold" 
                  />
                  <Input 
                    value={settings.imageUrl} 
                    onChange={e => setSettings({...settings, imageUrl: e.target.value})} 
                    placeholder="Ou digite a URL da imagem..."
                    className="bg-background text-xs flex-1" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Painel Central: Próxima Sessão & Metatrama */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-card border border-border p-6 rounded-lg shadow-lg relative overflow-hidden">
             {/* Fundo sutil com ícone */}
             <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
                <Skull className="w-64 h-64 text-blood" />
             </div>
             
             <h3 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
               Resumo da Metatrama <span className="text-blood animate-pulse flex h-2 w-2 rounded-full bg-blood"></span>
             </h3>
             
             <div className="bg-surface-container-low border border-border/50 p-4 rounded text-sm text-foreground/80 leading-relaxed mb-6">
               {isEditing ? (
                 <div className="space-y-3 relative z-10">
                   <Input 
                     value={settings.metaTitle} 
                     onChange={e => setSettings({...settings, metaTitle: e.target.value})} 
                     className="bg-background border-primary text-primary font-bold h-8" 
                   />
                   <Textarea 
                     value={settings.metaText} 
                     onChange={e => setSettings({...settings, metaText: e.target.value})} 
                     className="bg-background min-h-[100px] border-border" 
                   />
                 </div>
               ) : (
                 <>
                   <strong className="text-primary block mb-1">{settings.metaTitle}</strong>
                   {settings.metaText}
                 </>
               )}
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
               {settings.trackers.map((tracker: any) => (
                 <div key={tracker.id} className={`bg-muted/30 p-3 rounded border text-center transition-all ${isEditing ? 'border-primary/50' : 'border-border/30'}`}>
                   {isEditing ? (
                     <div className="space-y-2">
                        <Input 
                          value={tracker.title} 
                          onChange={(e) => updateTracker(tracker.id, "title", e.target.value)} 
                          className="h-6 text-[10px] text-center bg-background border-border uppercase tracking-widest text-muted-foreground p-0" 
                        />
                        <Input 
                          value={tracker.value} 
                          onChange={(e) => updateTracker(tracker.id, "value", e.target.value)} 
                          className="h-8 text-sm text-center font-bold bg-background border-border text-foreground" 
                        />
                     </div>
                   ) : (
                     <div className="py-1">
                       <span className="block text-[10px] uppercase text-muted-foreground tracking-widest mb-1 truncate">{tracker.title}</span>
                       <span className={`font-bold truncate block ${tracker.id === 1 ? 'text-blood' : tracker.id === 2 ? 'text-yellow-600' : tracker.id === 4 ? 'text-primary' : ''}`}>
                         {tracker.value}
                       </span>
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
             <Link to="/teia" className="bg-gradient-to-br from-card to-surface-container-low border border-border p-5 rounded-lg group hover:border-blood/50 transition-all shadow hover:shadow-[0_0_15px_rgba(139,0,0,0.1)] flex flex-col justify-center">
               <Network className="w-8 h-8 text-blood mb-3 opacity-80" />
               <h4 className="font-serif font-bold text-lg mb-1 flex justify-between items-center">
                 Teia de Intrigas
                 <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-blood -translate-x-2 group-hover:translate-x-0" />
               </h4>
               <p className="text-xs text-muted-foreground uppercase tracking-widest">Acessar mapa social do Domínio</p>
             </Link>
             
             <Link to="/atlas" className="bg-gradient-to-br from-card to-surface-container-low border border-border p-5 rounded-lg group hover:border-primary/50 transition-all shadow hover:shadow-[0_0_15px_rgba(255,180,168,0.1)] flex flex-col justify-center">
               <MapPin className="w-8 h-8 text-primary mb-3 opacity-80" />
               <h4 className="font-serif font-bold text-lg mb-1 flex justify-between items-center">
                 Atlas Sombrio
                 <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-primary -translate-x-2 group-hover:translate-x-0" />
               </h4>
               <p className="text-xs text-muted-foreground uppercase tracking-widest">Acessar locais e ressonâncias</p>
             </Link>
          </div>
        </div>

        {/* Painel Lateral: Atalhos do Mestre */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Link to="/escudo" className="bg-red-950/20 border border-blood/30 p-4 rounded-lg group hover:bg-blood/10 transition-colors flex items-center gap-4 shadow-lg">
             <div className="bg-blood/20 p-3 rounded border border-blood/40 text-blood">
               <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
               <h4 className="font-bold font-serif text-foreground group-hover:text-blood-glow transition-colors">Escudo do Narrador</h4>
               <p className="text-xs text-muted-foreground">Consultar regras da V5 na hora</p>
             </div>
          </Link>

          <Link to="/coterie" className="bg-surface-container-low border border-border p-4 rounded-lg group hover:bg-surface-container-high transition-colors flex items-center gap-4">
             <div className="bg-muted p-3 rounded border border-border/50 text-foreground">
               <Sparkles className="w-6 h-6" />
             </div>
             <div>
               <h4 className="font-bold font-serif text-foreground">Painel da Coterie</h4>
               <p className="text-xs text-muted-foreground">Gerenciar Fome, Humanidade e Trackers</p>
             </div>
          </Link>
          
          <Link to="/diario" className="bg-surface-container-low border border-border p-4 rounded-lg group hover:bg-surface-container-high transition-colors flex items-center gap-4">
             <div className="bg-muted p-3 rounded border border-border/50 text-foreground">
               <BookOpen className="w-6 h-6" />
             </div>
             <div>
               <h4 className="font-bold font-serif text-foreground">Diário de Crônica</h4>
               <p className="text-xs text-muted-foreground">Log de Sessões e Scratchpad livre</p>
             </div>
          </Link>

          <div className="mt-auto bg-surface border border-border/40 p-4 rounded-lg text-center opacity-70">
            <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Grimório Narrador v1.0.0</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Sistemas V5 integrados & Customizáveis.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
