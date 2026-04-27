import { useState } from "react";
import { Plus, Eye, EyeOff, MapPin, ShieldAlert, Users, Skull, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { LocationDialog } from "@/components/LocationDialog";

export default function AtlasPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  const [locations, setLocations] = useCloudStorage<any[]>("v5_atlas", []);

  const saveLocation = (locData: any) => {
    setLocations(prev => {
      const exists = prev.find(l => l.id === locData.id);
      if (exists) return prev.map(l => l.id === locData.id ? locData : l);
      return [...prev, locData];
    });
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const getBadgeVariant = (type: string) => {
    switch(type) {
      case 'Elysium': return 'default';
      case 'Haven da Coterie': return 'secondary';
      case 'Hunting Ground': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Atlas Sombrio</h1>
            <p className="text-muted-foreground mt-1 text-sm">Locais, Domínios e Segredos do tabuleiro geográfico</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Domínio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group flex flex-col"
          >
            {/* Header Image */}
            <div className="aspect-[16/9] bg-muted relative overflow-hidden">
              <img 
                src={loc.image_url} 
                alt={loc.name} 
                className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" 
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-background via-transparent to-transparent"></div>
              
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <h3 className="font-serif font-black text-2xl tracking-wide text-white drop-shadow-md">{loc.name}</h3>
                <Badge variant={getBadgeVariant(loc.type)} className="text-xs uppercase tracking-widest shadow-lg">
                  {loc.type}
                </Badge>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col space-y-4 relative">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {loc.description_public}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Controlador</span>
                    <span className="text-xs font-semibold">{loc.controller}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Segurança</span>
                    <span className="text-xs font-semibold line-clamp-2">{loc.security_level}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <Activity className="w-4 h-4 text-blood mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Ressonância Comum (Sangue)</span>
                    <span className="text-xs font-semibold text-blood/80">{loc.resonance}</span>
                  </div>
                </div>
              </div>

              {/* Narrator Secrets Accordion */}
              <div className="mt-auto pt-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="master_secrets" className="border-blood/30">
                    <AccordionTrigger className="text-blood hover:text-blood-glow py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="flex gap-2 items-center">
                        <Skull className="w-4 h-4" />
                        Segredos do Narrador
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-foreground/80 bg-blood/5 p-4 rounded-b-md border-l-2 border-blood leading-relaxed italic relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blood/10 blur-xl rounded-full"></div>
                      {loc.master_secrets}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
            </div>
          </div>
        ))}
      </div>
      
      <LocationDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSave={saveLocation} 
      />
    </div>
  );
}
