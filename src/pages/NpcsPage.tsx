import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Skull, Shield, Search, Scale, ScrollText, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NpcDialog } from "@/components/NpcDialog";
import { toast } from "sonner";
import { getPrefixedKey } from "@/components/ChronicleSwitcher";
import { generateUUID } from "@/lib/uuid";

export default function NpcsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<any>(null);
  const [filter, setFilter] = useState("");
  const [combatMode, setCombatMode] = useState<Record<string, boolean>>({});
  const [npcs, setNpcs] = useCloudStorage<any[]>("v5_npcs", []);

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

  const categories = Array.from(new Set(filtered.map(npc => npc.category || "Sem Categoria"))).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Ghost className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Galeria de NPCs</h1>
            <p className="text-muted-foreground mt-1 text-sm">Códice de personagens do narrador</p>
          </div>
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
        <div className="space-y-12">
          {categories.map(category => (
            <div key={category}>
              <h2 className="text-2xl font-serif font-bold text-primary mb-6 flex items-center gap-2 border-b border-border/50 pb-2">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.filter(npc => (npc.category || "Sem Categoria") === category).map((npc) => (
                  <div key={npc.id} className="bg-card/50 border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-all flex flex-col group shadow-sm hover:shadow-md hover:shadow-primary/5">
                    <div className="relative w-full aspect-[4/3] bg-muted/30 overflow-hidden">
                      {npc.image_url ? (
                        <img src={npc.image_url} alt={npc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Ghost className="w-12 h-12 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3
                          className="font-serif font-bold text-2xl text-foreground drop-shadow-md cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                          onClick={() => { setEditingNpc(npc); setDialogOpen(true); }}
                        >
                          {npc.name}
                        </h3>
                        <div className="flex gap-2 flex-wrap mt-2">
                          {npc.status === "Morte Final" && (
                            <Badge variant="destructive" className="text-[10px] py-0 uppercase tracking-wider font-semibold">
                              <Skull className="w-3 h-3 mr-1" /> Morte
                            </Badge>
                          )}
                          {npc.category && (
                            <Badge variant="default" className="text-[10px] py-0 uppercase tracking-wider font-semibold bg-primary/20 text-primary hover:bg-primary/30 border-none">{npc.category}</Badge>
                          )}
                          {npc.role && npc.role !== "Nenhum" && (
                            <Badge variant="secondary" className="text-[10px] py-0 uppercase tracking-wider font-semibold border-border/50">{npc.role}</Badge>
                          )}
                          {npc.species_faction && (
                            <Badge variant="secondary" className="text-[10px] py-0 uppercase tracking-wider font-semibold border-border/50">{npc.species_faction}</Badge>
                          )}
                          {npc.clan && (
                            <Badge variant="outline" className="text-[10px] py-0 uppercase tracking-wider font-semibold bg-background/50 backdrop-blur-sm border-border/50">{npc.clan}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex-1 mb-6">
                        {npc.appearance ? (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1"><ScrollText className="w-3 h-3"/> Aparência</span>
                            <p className="text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">{npc.appearance}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">Nenhuma descrição disponível...</p>
                        )}
                        
                        {npc.history && (
                          <div className="mt-4 space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1"><ScrollText className="w-3 h-3"/> Histórico</span>
                            <p className="text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-wrap">{npc.history}</p>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        className={`w-full gap-2 border-border/50 hover:border-primary/50 transition-colors ${combatMode[npc.id] ? "bg-primary/10 text-primary border-primary/50" : ""}`}
                        onClick={() => setCombatMode((prev) => ({ ...prev, [npc.id]: !prev[npc.id] }))}
                      >
                        <Shield className="w-4 h-4" /> {combatMode[npc.id] ? "Ocultar Status" : "Ver Status & Combate"}
                      </Button>
                    </div>

                    {combatMode[npc.id] && (
                      <div className="border-t border-border/50 p-5 bg-card/80 text-sm space-y-4">
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-muted/30 rounded p-2 text-center">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Físico</span>
                            <span className="text-lg font-bold">{npc.physical_pool}</span>
                          </div>
                          <div className="bg-muted/30 rounded p-2 text-center">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Social</span>
                            <span className="text-lg font-bold">{npc.social_pool}</span>
                          </div>
                          <div className="bg-muted/30 rounded p-2 text-center">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">Mental</span>
                            <span className="text-lg font-bold">{npc.mental_pool}</span>
                          </div>
                          <div className="bg-muted/30 rounded p-2 text-center border border-red-500/20">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-red-500/70 mb-1">Vida</span>
                            <span className="text-lg font-bold text-red-500">{npc.health}</span>
                          </div>
                        </div>

                        {npc.blood_potency !== null && npc.blood_potency > 0 && (
                          <div className="bg-primary/5 rounded p-3 border border-primary/20 flex items-center justify-between">
                            <span className="text-xs uppercase font-bold tracking-wider text-primary flex items-center gap-2">
                              Potência de Sangue
                            </span>
                            <span className="text-lg font-bold text-primary">{npc.blood_potency}</span>
                          </div>
                        )}

                        {/* Disciplinas */}
                        {Array.isArray(npc.disciplines) && npc.disciplines.length > 0 ? (
                          <div className="pt-2 border-t border-border/30">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Disciplinas & Trunfos</span>
                            <div className="space-y-2">
                              {npc.disciplines.map((disc: any, idx: number) => (
                                <div key={disc.id || idx} className="bg-background/60 p-2.5 rounded border border-border/40 text-xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-primary" /> {disc.name || "Disciplina"}
                                    </span>
                                    {disc.level !== undefined && disc.level !== null && (
                                      <Badge variant="default" className="text-[9px] bg-primary/20 text-primary border-none py-0">
                                        Nível {disc.level}
                                      </Badge>
                                    )}
                                  </div>
                                  {disc.powers && (
                                    <p className="text-[11px] text-muted-foreground whitespace-pre-line leading-relaxed pl-1 border-l-2 border-primary/30 mt-1">
                                      {disc.powers}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : typeof npc.disciplines === "string" && npc.disciplines ? (
                          <div className="pt-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Disciplinas</span>
                            <p className="text-sm font-medium">{npc.disciplines}</p>
                          </div>
                        ) : null}

                        {/* Especialidades */}
                        {Array.isArray(npc.specialties) && npc.specialties.length > 0 ? (
                          <div className="pt-2 border-t border-border/30 mt-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-2">Especialidades</span>
                            <div className="flex flex-wrap gap-1.5">
                              {npc.specialties.map((spec: any, idx: number) => (
                                <Badge key={spec.id || idx} variant="outline" className="text-[11px] bg-background/50 border-border/60 py-0.5 px-2 font-medium">
                                  <span className="text-primary font-semibold">{spec.pericia}</span>
                                  {spec.foco && <span className="text-muted-foreground ml-1">({spec.foco})</span>}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : typeof npc.specialties === "string" && npc.specialties ? (
                          <div className="pt-2 border-t border-border/30 mt-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block mb-1">Especialidades</span>
                            <p className="text-sm">{npc.specialties}</p>
                          </div>
                        ) : null}

                        {npc.master_secrets && (
                          <div className="pt-4">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="secret" className="border-blood/30">
                                <AccordionTrigger className="text-blood hover:text-blood-glow py-2 text-sm font-bold uppercase tracking-widest">
                                  Segredos Obscuros
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-muted-foreground bg-blood/5 p-3 rounded-b-md border-l-2 border-blood">
                                  {npc.master_secrets}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        )}

                        {/* Integração com Boons (Livro de Dívidas) */}
                        <div className="mt-4 bg-background/40 p-3 rounded border border-border/50">
                          <h5 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                            <Scale className="w-3 h-3"/> Dívidas e Favores
                          </h5>
                          {(() => {
                            const savedBoons = localStorage.getItem(getPrefixedKey("v5_boons"));
                            const allBoons = savedBoons ? JSON.parse(savedBoons) : [];
                            const npcBoons = allBoons.filter((b: any) => 
                              (b.from.toLowerCase() === npc.name.toLowerCase() || b.to.toLowerCase() === npc.name.toLowerCase()) && !b.isResolved
                            );

                            if (npcBoons.length === 0) return <p className="text-[10px] italic text-muted-foreground">Nenhum débito ativo.</p>;

                            return (
                              <div className="space-y-2">
                                {npcBoons.map((boon: any) => (
                                  <div key={boon.id} className="text-xs flex flex-col gap-1 pb-2 border-b border-border/30 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[8px] uppercase px-1 py-0">{boon.type}</Badge>
                                      <span className="font-semibold text-foreground">
                                        {boon.from.toLowerCase() === npc.name.toLowerCase() ? "DEVE para " + boon.to : "A RECEBER de " + boon.from}
                                      </span>
                                    </div>
                                    <span className="text-muted-foreground opacity-70 ml-1 block">{boon.description}</span>
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
            </div>
          ))}
        </div>
      )}

      <NpcDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        npc={editingNpc}
        onDelete={(id) => deleteNpc.mutate(id)}
        onSave={(npcData) => {
          if (editingNpc) {
            setNpcs((prev) => prev.map((n) => n.id === editingNpc.id ? { ...npcData, id: editingNpc.id } : n));
            toast.success("NPC atualizado.");
          } else {
            const newNpc = { ...npcData, id: generateUUID() };
            setNpcs((prev) => [newNpc, ...prev]);
            toast.success("NPC criado.");
          }
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
