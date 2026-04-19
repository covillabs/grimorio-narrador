import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Skull, Shield, Search, Scale, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NpcDialog } from "@/components/NpcDialog";
import { toast } from "sonner";

export default function NpcsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [combatMode, setCombatMode] = useState<Record<string, boolean>>({});
  const [npcs, setNpcs] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_npcs");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "1",
        name: "Príncipe Sebastian Van Der Meer",
        species_faction: "Camarilla",
        clan: "Ventrue",
        status: "Ativo",
        appearance: "Um senhor de idade aparentemente nos seus 50 anos mortais, sempre vestido com ternos impecáveis. Seus olhos são frios e calculistas.",
        image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
        physical_pool: 5,
        social_pool: 9,
        mental_pool: 8,
        health: 6,
        blood_potency: 4,
        disciplines: "Dominação 4, Fortitude 3, Presença 3",
        specialties: "Liderança, Manipulação de Mercado",
        secrets: "Ele está secretamente financiando uma facção Anarch rival para enfraquecer o Barão Zora sem se envolver diretamente."
      },
      {
        id: "2",
        name: "Baronesa Zora",
        species_faction: "Anarch",
        clan: "Brujah",
        status: "Ativo",
        appearance: "Elegante e intensa, usa joias douradas pesadas. Constantemente desafia as tradições, mas mantém controle estrito em seu domínio.",
        image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
        physical_pool: 8,
        social_pool: 6,
        mental_pool: 5,
        health: 8,
        blood_potency: 3,
        disciplines: "Rapidez 3, Potência 4, Presença 2",
        specialties: "Intimidação, Combate Desarmado",
        secrets: 'Zora deve um "Boon de Sangue" ("Life Debt") a um ancião Tremere, algo que ela esconde a todo custo dos outros Anarchs.'
      },
      {
        id: "3",
        name: "O Algoz (The Scourge)",
        species_faction: "Camarilla",
        clan: "Desconhecido",
        status: "Ativo",
        appearance: "Rosto oculto sob capuz pesado, age apenas nas sombras a mando do Príncipe.",
        image_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&auto=format&fit=crop",
        physical_pool: 10,
        social_pool: 2,
        mental_pool: 6,
        health: 9,
        blood_potency: 5,
        disciplines: "Ofuscação 5, Rapidez 4, Potência 3",
        specialties: "Furtividade, Assassinato",
        secrets: "Ele é na verdade um carniçal ancestral superpoderoso, não um vampiro."
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("v5_npcs", JSON.stringify(npcs));
  }, [npcs]);

  const isLoading = false;

  const deleteNpc = {
    mutate: (id: string) => {
      setNpcs(prev => prev.filter(npc => npc.id !== id));
      toast.success("NPC removido.");
      setDialogOpen(false);
    }
  };

  const filtered = npcs.filter((npc) =>
    !filter || 
    (npc.species_faction && npc.species_faction.toLowerCase().includes(filter.toLowerCase())) || 
    (npc.clan && npc.clan.toLowerCase().includes(filter.toLowerCase())) ||
    npc.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Galeria de NPCs</h1>
          <p className="text-muted-foreground mt-1">Códice de personagens do narrador</p>
        </div>
        <Button onClick={() => { setEditingNpc(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo NPC
        </Button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por nome ou facção..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhum NPC encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((npc) => (
            <div key={npc.id} className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
              <div className="flex items-start p-4 gap-4">
                <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                  {npc.image_url ? (
                    <img src={npc.image_url} alt={npc.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-xl">
                      {npc.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className="font-serif font-semibold cursor-pointer hover:text-primary transition-colors"
                      onClick={() => { setEditingNpc(npc); setDialogOpen(true); }}
                    >
                      {npc.name}
                    </h3>
                    {npc.status === "Morte Final" && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <Skull className="w-3 h-3" /> Morte Final
                      </Badge>
                    )}
                    {npc.species_faction && (
                      <Badge variant="secondary" className="text-xs">{npc.species_faction}</Badge>
                    )}
                    {npc.clan && (
                      <Badge variant="outline" className="text-xs">{npc.clan}</Badge>
                    )}
                  </div>
                  {npc.appearance && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{npc.appearance}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCombatMode((prev) => ({ ...prev, [npc.id]: !prev[npc.id] }))}
                  className={`gap-1 ${combatMode[npc.id] ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Shield className="w-4 h-4" /> Combate
                </Button>
              </div>

              {combatMode[npc.id] && (
                <div className="border-t border-border p-4 bg-muted/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Físico</span>
                    <p className="font-bold text-lg">{npc.physical_pool}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Social</span>
                    <p className="font-bold text-lg">{npc.social_pool}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Mental</span>
                    <p className="font-bold text-lg">{npc.mental_pool}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs uppercase tracking-wider">Vitalidade</span>
                    <p className="font-bold text-lg">{npc.health}</p>
                  </div>
                  {npc.blood_potency !== null && npc.blood_potency > 0 && (
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Potência</span>
                      <p className="font-bold text-lg text-primary">{npc.blood_potency}</p>
                    </div>
                  )}
                  {npc.disciplines && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Disciplinas</span>
                      <p className="text-sm mt-1">{npc.disciplines}</p>
                    </div>
                  )}
                  {npc.specialties && (
                    <div className="col-span-2 md:col-span-4">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Especialidades</span>
                      <p className="text-sm mt-1">{npc.specialties}</p>
                    </div>
                  )}
                  {npc.secrets && (
                    <div className="col-span-2 md:col-span-4 mt-2">
                       <Accordion type="single" collapsible className="w-full">
                         <AccordionItem value="secret" className="border-blood/30">
                           <AccordionTrigger className="text-blood hover:text-blood-glow py-2 text-sm font-bold uppercase tracking-widest">
                             Segredos Obscuros (Apenas Narrador)
                           </AccordionTrigger>
                           <AccordionContent className="text-sm text-muted-foreground bg-blood/5 p-3 rounded-b-md border-l-2 border-blood">
                             {npc.secrets}
                           </AccordionContent>
                         </AccordionItem>
                       </Accordion>
                    </div>
                  )}

                  {/* Integração com Boons (Livro de Dívidas) */}
                  <div className="col-span-2 md:col-span-4 mt-4 bg-background/40 p-3 rounded border border-border/50">
                    <h5 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <Scale className="w-3 h-3"/> Dívidas e Favores Neste Códice
                    </h5>
                    {(() => {
                      const savedBoons = localStorage.getItem("v5_boons");
                      const allBoons = savedBoons ? JSON.parse(savedBoons) : [];
                      const npcBoons = allBoons.filter((b: any) => 
                        (b.from.toLowerCase() === npc.name.toLowerCase() || b.to.toLowerCase() === npc.name.toLowerCase()) && !b.isResolved
                      );

                      if (npcBoons.length === 0) return <p className="text-[10px] italic text-muted-foreground">Nenhum débito ativo registrado.</p>;

                      return (
                        <div className="space-y-2">
                          {npcBoons.map((boon: any) => (
                            <div key={boon.id} className="text-xs flex items-center gap-2">
                              <Badge variant="outline" className="text-[8px] uppercase">{boon.type}</Badge>
                              <span className="font-semibold text-foreground">
                                {boon.from.toLowerCase() === npc.name.toLowerCase() ? "DEVE para " + boon.to : "A RECEBER de " + boon.from}
                              </span>
                              <span className="text-muted-foreground opacity-60">— {boon.description}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <NpcDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        npc={editingNpc}
        onDelete={(id) => deleteNpc.mutate(id)}
      />
    </div>
  );
}
