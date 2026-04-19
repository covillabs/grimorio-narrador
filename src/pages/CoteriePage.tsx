import { useState, useEffect } from "react";
import { Plus, Crosshair, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HungerTracker } from "@/components/HungerTracker";
import { HumanityTracker } from "@/components/HumanityTracker";
import { PlayerDialog } from "@/components/PlayerDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const CLAN_DISCIPLINES: Record<string, {name: string, desc: string}[]> = {
  "Brujah": [
    {name: "Potência", desc: "Aumenta dano contundente ou converte em Agravado (Corpo Letal)."},
    {name: "Rapidez", desc: "Velocidade mística. Adiciona os pontos à reserva de esquiva."},
    {name: "Presença", desc: "Rola Carisma+Presença para Awe (Fascínio) ou Daunt (Pavor)."}
  ],
  "Toreador": [
    {name: "Auspícios", desc: "Raciocínio+Auspícios para ver o Invíisvel ou Premonição."},
    {name: "Rapidez", desc: "Velocidade mística. Adiciona os pontos à reserva de esquiva."},
    {name: "Presença", desc: "Rola Carisma+Presença para Awe (Fascínio) ou Daunt (Pavor)."}
  ],
  "Ventrue": [
    {name: "Dominação", desc: "Contato visual! Carisma+Dominação vs Int+Perseverança."},
    {name: "Fortitude", desc: "Soma o nível de Fortitude em rolagens de Vigor ou Saúde."},
    {name: "Presença", desc: "Manipulação+Presença para forçar obediência ou medo."}
  ],
  "Malkaviano": [
    {name: "Auspícios", desc: "Raciocínio+Auspícios para ver o Invisível."},
    {name: "Dominação", desc: "Carisma+Dominação. Sem necessidade de lógica, apenas a ordem."},
    {name: "Ofuscação", desc: "Esconder-se. Rola Inteligência+Ofuscação para o manto invisível."}
  ],
  "Nosferatu": [
    {name: "Potência", desc: "Golpes esmagadores quebrando barricadas ou alvos."},
    {name: "Ofuscação", desc: "Furtividade Sobrenatural. Não funciona sob vigilância visual direta."},
    {name: "Animalismo", desc: "Carisma+Animalismo para acalmar bestas ou comandar pragas."}
  ],
  "Tremere": [
    {name: "Auspícios", desc: "Raciocínio+Auspícios para predição ou ver ilusões."},
    {name: "Dominação", desc: "Hipnose rápida de ordem curta (Carisma+Dominação)."},
    {name: "Feitiçaria", desc: "Rola Inteligência+Magia do Sangue. Requer rituais estudados."}
  ],
  "Gangrel": [
    {name: "Animalismo", desc: "Falar com animais ou esmagar a Besta alheia."},
    {name: "Fortitude", desc: "Ignorar dano. Converte dano agravado em superficial em níveis altos."},
    {name: "Metamorfose", desc: "Garras causam dano Agravado não redutível (+2 de Dano Fixo)."}
  ]
};

export default function CoteriePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [arsenal, setArsenal] = useState<any[]>([]);

  const [players, setPlayers] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_coterie");
    if (saved) return JSON.parse(saved);
    return [
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
    ];
  });

  useEffect(() => {
    localStorage.setItem("v5_coterie", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    const savedArsenal = localStorage.getItem("v5_arsenal");
    if (savedArsenal) {
      setArsenal(JSON.parse(savedArsenal));
    }
  }, []);

  const updateTracker = {
    mutate: ({ id, field, value }: { id: string; field: string; value: number }) => {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }
  };

  const deletePlayer = {
    mutate: (id: string) => {
      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.success("Personagem removido.");
      setDialogOpen(false);
    }
  };

  const rollRouse = (playerId: string, currentHunger: number) => {
    if (currentHunger >= 5) {
      toast.error("Frenesi absoluto. Um vampiro Fome 5 deve devorar, ou cairá em letargia.");
      return;
    }
    const result = Math.floor(Math.random() * 10) + 1;
    if (result <= 5) {
      updateTracker.mutate({ id: playerId, field: "hunger", value: currentHunger + 1 });
      toast.error(`Falha! Tirou ${result} no Despertar. Fome aumentou.`);
    } else {
      toast.success(`Êxito! Tirou ${result}. O Sangue se manteve domado.`);
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

      {players.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhum personagem na Coterie</p>
          <p className="text-sm mt-2">Adicione seu primeiro personagem para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-card border border-border rounded-lg hover:border-primary/40 transition-colors cursor-pointer group/card relative"
              onClick={() => { setEditingPlayer(player); setDialogOpen(true); }}
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden rounded-t-lg">
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
                  <p className="text-sm text-muted-foreground mb-2">
                    {[player.clan, player.player_name && `(${player.player_name})`].filter(Boolean).join(" ")}
                  </p>
                  {/* Disciplines Container */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {CLAN_DISCIPLINES[player.clan]?.map((disc, idx) => (
                      <div key={idx} className="group relative">
                        <Badge variant="outline" className="text-[10px] cursor-help border-blood/50 text-blood hover:bg-blood hover:text-white transition-colors">
                          {disc.name}
                        </Badge>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-[160px] p-2 bg-zinc-950 border border-blood rounded text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-2xl">
                          <Zap className="w-3 h-3 text-blood mb-1" />
                          {disc.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-primary font-medium tracking-wider uppercase">Fome</span>
                      <Button size="icon" variant="outline" className="h-4 w-4 bg-transparent border-blood/50 text-blood hover:bg-blood hover:text-white rounded-full flex items-center justify-center p-0" title="Rouse Check (Despertar)" onClick={(e) => { e.stopPropagation(); rollRouse(player.id, player.hunger); }}>
                         <Zap className="w-2 h-2" />
                      </Button>
                    </div>
                    <HungerTracker
                      value={player.hunger}
                      size="sm"
                      onChange={(v) => updateTracker.mutate({ id: player.id, field: "hunger", value: v })}
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gold font-medium tracking-wider uppercase block mb-1">Humanidade</span>
                    <HumanityTracker
                      value={player.humanity}
                      size="sm"
                      onChange={(v) => updateTracker.mutate({ id: player.id, field: "humanity", value: v })}
                    />
                  </div>
                </div>

                {/* Inventário do Jogador puxado do Arsenal */}
                <div className="pt-3 border-t border-border mt-3">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Inventário Físico
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {arsenal.filter(item => item.owner === player.character_name || item.owner === player.character_name.split(' ')[0]).length > 0 ? (
                      arsenal.filter(item => item.owner === player.character_name || item.owner === player.character_name.split(' ')[0])
                        .map(item => (
                          <div key={item.id} className="flex flex-col bg-surface-container-low p-2 rounded border border-border/50 group-hover:border-primary/20 transition-colors">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                              <Crosshair className="w-3 h-3 text-blood opacity-80" /> {item.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground pl-4 leading-tight mt-0.5">{item.modifier}</span>
                          </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Nenhum artefato equipado.</span>
                    )}
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
