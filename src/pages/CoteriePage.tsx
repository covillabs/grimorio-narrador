import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HungerTracker } from "@/components/HungerTracker";
import { HumanityTracker } from "@/components/HumanityTracker";
import { PlayerDialog } from "@/components/PlayerDialog";
import { toast } from "sonner";

export default function CoteriePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase.from("players").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const updateTracker = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: number }) => {
      const { error } = await supabase.from("players").update({ [field]: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["players"] }),
  });

  const deletePlayer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Personagem removido.");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">A Coterie</h1>
          <p className="text-muted-foreground mt-1">Seus personagens jogadores</p>
        </div>
        <Button onClick={() => { setEditingPlayer(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Personagem
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhum personagem na Coterie</p>
          <p className="text-sm mt-2">Adicione seu primeiro personagem para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-colors cursor-pointer group"
              onClick={() => { setEditingPlayer(player); setDialogOpen(true); }}
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {player.image_url ? (
                  <img src={player.image_url} alt={player.character_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="font-serif text-4xl opacity-30">
                      {player.character_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-serif font-semibold text-lg">{player.character_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[player.clan, player.player_name && `(${player.player_name})`].filter(Boolean).join(" ")}
                  </p>
                </div>
                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <span className="text-xs text-primary font-medium tracking-wider uppercase">Fome</span>
                    <HungerTracker
                      value={player.hunger}
                      size="sm"
                      onChange={(v) => updateTracker.mutate({ id: player.id, field: "hunger", value: v })}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gold font-medium tracking-wider uppercase">Humanidade</span>
                    <HumanityTracker
                      value={player.humanity}
                      size="sm"
                      onChange={(v) => updateTracker.mutate({ id: player.id, field: "humanity", value: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlayerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        player={editingPlayer}
        onDelete={(id) => deletePlayer.mutate(id)}
      />
    </div>
  );
}
