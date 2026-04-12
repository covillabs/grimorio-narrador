import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Skull, Shield, Search } from "lucide-react";
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
  const queryClient = useQueryClient();

  const { data: npcs = [], isLoading } = useQuery({
    queryKey: ["npcs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("npcs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteNpc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("npcs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["npcs"] });
      toast.success("NPC removido.");
    },
  });

  const filtered = npcs.filter((npc) =>
    !filter || npc.species_faction?.toLowerCase().includes(filter.toLowerCase()) || npc.name.toLowerCase().includes(filter.toLowerCase())
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
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Especialidades</span>
                      <p className="text-sm mt-1">{npc.specialties}</p>
                    </div>
                  )}
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
