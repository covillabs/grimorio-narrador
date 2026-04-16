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
  const [mockPlayers, setMockPlayers] = useState([
    {
      id: "1",
      character_name: "Lucien (O Belo)",
      player_name: "João",
      clan: "Toreador",
      image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
      hunger: 2,
      humanity: 7,
    },
    {
      id: "2",
      character_name: "Viktoria",
      player_name: "Ana",
      clan: "Ventrue",
      image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop",
      hunger: 4,
      humanity: 5,
    },
    {
      id: "3",
      character_name: "Kaleb",
      player_name: "Marcos",
      clan: "Brujah",
      image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop",
      hunger: 1,
      humanity: 6,
    }
  ]);

  const isLoading = false;
  const players = mockPlayers;

  const updateTracker = {
    mutate: ({ id, field, value }: { id: string; field: string; value: number }) => {
      setMockPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }
  };

  const deletePlayer = {
    mutate: (id: string) => {
      setMockPlayers(prev => prev.filter(p => p.id !== id));
      toast.success("Personagem removido.");
      setDialogOpen(false);
    }
  };

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
