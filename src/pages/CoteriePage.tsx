import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { supabase } from "@/integrations/supabase/client";
import { calculateCharacterStats } from "@/utils/calculateCharacterStats";
import { Plus, Crosshair, Sparkles, Zap, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HungerTracker } from "@/components/HungerTracker";
import { HumanityTracker } from "@/components/HumanityTracker";
import { PlayerDialog } from "@/components/PlayerDialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getPrefixedKey } from "@/components/ChronicleSwitcher";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Componente para exibir valores com modificadores visuais no formato +X (verde) / -X (vermelho)
export function ModifiedValue({
  baseValue,
  modValue = 0,
  className = "",
}: {
  baseValue: number;
  modValue?: number;
  className?: string;
}) {
  const safeBase = Number.isFinite(baseValue) ? baseValue : 0;
  const safeMod = Number.isFinite(modValue) ? modValue : 0;

  return (
    <span className={`inline-flex items-center font-mono ${className}`}>
      <span>{safeBase}</span>
      {safeMod > 0 && (
        <span className="text-emerald-400 text-xs font-bold ml-1">
          +{safeMod}
        </span>
      )}
      {safeMod < 0 && (
        <span className="text-rose-400 text-xs font-bold ml-1">
          {safeMod}
        </span>
      )}
    </span>
  );
}

// Extrai um resumo rápido das regras e modificadores de um item
function getItemSummary(item: any): string[] {
  if (!item || typeof item !== "object") return [];
  const summaries: string[] = [];

  let rules: any[] = [];
  const rawRules = item.rules_bonus || item.regras_bonus;
  if (Array.isArray(rawRules)) {
    rules = rawRules;
  } else if (typeof rawRules === "string" && rawRules.startsWith("[")) {
    try {
      rules = JSON.parse(rawRules);
    } catch {}
  }

  if (rules.length > 0) {
    rules.forEach((r) => {
      if (!r || typeof r !== "object") return;
      const mods = r.modificadores || r.modifiers || [];
      if (Array.isArray(mods) && mods.length > 0) {
        mods.forEach((m: any) => {
          if (!m) return;
          const val = m.valor !== undefined ? m.valor : m.value;
          const target = m.alvo || m.target || "Combate";
          const sign = val > 0 ? `+${val}` : `${val}`;
          summaries.push(`${sign} ${target}`);
        });
      } else if (r.title || r.nome) {
        summaries.push(r.title || r.nome);
      }
    });
  } else if (item.modifier) {
    summaries.push(item.modifier);
  }

  return summaries;
}

const CLAN_DISCIPLINES: Record<string, { name: string; desc: string }[]> = {
  Brujah: [
    { name: "Potência", desc: "Aumenta dano contundente ou converte em Agravado (Corpo Letal)." },
    { name: "Rapidez", desc: "Velocidade mística. Adiciona os pontos à reserva de esquiva." },
    { name: "Presença", desc: "Rola Carisma+Presença para Awe (Fascínio) ou Daunt (Pavor)." },
  ],
  Toreador: [
    { name: "Auspícios", desc: "Raciocínio+Auspícios para ver o Invisível ou Premonição." },
    { name: "Rapidez", desc: "Velocidade mística. Adiciona os pontos à reserva de esquiva." },
    { name: "Presença", desc: "Rola Carisma+Presença para Awe (Fascínio) ou Daunt (Pavor)." },
  ],
  Ventrue: [
    { name: "Dominação", desc: "Contato visual! Carisma+Dominação vs Int+Perseverança." },
    { name: "Fortitude", desc: "Soma o nível de Fortitude em rolagens de Vigor ou Saúde." },
    { name: "Presença", desc: "Manipulação+Presença para forçar obediência ou medo." },
  ],
  Malkavian: [
    { name: "Auspícios", desc: "Raciocínio+Auspícios para ver o Invisível." },
    { name: "Dominação", desc: "Carisma+Dominação. Sem necessidade de lógica, apenas a ordem." },
    { name: "Ofuscação", desc: "Esconder-se. Rola Inteligência+Ofuscação para o manto invisível." },
  ],
  Nosferatu: [
    { name: "Potência", desc: "Golpes esmagadores quebrando barricadas ou alvos." },
    { name: "Ofuscação", desc: "Furtividade Sobrenatural. Não funciona sob vigilância visual direta." },
    { name: "Animalismo", desc: "Carisma+Animalismo para acalmar bestas ou comandar pragas." },
  ],
  Tremere: [
    { name: "Auspícios", desc: "Raciocínio+Auspícios para predição ou ver ilusões." },
    { name: "Dominação", desc: "Hipnose rápida de ordem curta (Carisma+Dominação)." },
    { name: "Feitiçaria de Sangue", desc: "Rola Inteligência+Magia do Sangue. Requer rituais estudados." },
  ],
  Gangrel: [
    { name: "Animalismo", desc: "Falar com animais ou esmagar a Besta alheia." },
    { name: "Fortitude", desc: "Ignorar dano. Converte dano agravado em superficial em níveis altos." },
    { name: "Metamorfose", desc: "Garras causam dano Agravado não redutível (+2 de Dano Fixo)." },
  ],
};

export default function CoteriePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [arsenal, setArsenal] = useState<any[]>([]);

  const [players, setPlayers] = useCloudStorage<any[]>("v5_coterie", []);

  useEffect(() => {
    try {
      const savedArsenal = localStorage.getItem(getPrefixedKey("v5_arsenal"));
      if (savedArsenal) {
        const parsed = JSON.parse(savedArsenal);
        if (Array.isArray(parsed)) setArsenal(parsed);
      }
    } catch (e) {
      console.error("Erro ao carregar arsenal do localStorage:", e);
    }
  }, []);

  const updateTracker = {
    mutate: ({ id, field, value }: { id: string; field: string; value: number }) => {
      setPlayers((prev) =>
        (prev || []).map((p) => (p && p.id === id ? { ...p, [field]: value } : p))
      );
    },
  };

  // Função para Atualização Rápida de Fome no Supabase (Quick Update)
  const handleQuickHungerUpdate = async (playerId: string, newHunger: number) => {
    setPlayers((prev) =>
      (prev || []).map((p) => (p && p.id === playerId ? { ...p, hunger: newHunger } : p))
    );

    try {
      const { error } = await supabase
        .from("players")
        .update({ hunger: newHunger })
        .eq("id", playerId);

      if (error) {
        console.error("Erro ao atualizar Fome no Supabase:", error);
      } else {
        toast.success(`Fome alterada para ${newHunger}.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const savePlayer = (playerData: any) => {
    if (!playerData) return;
    setPlayers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.find((p) => p && p.id === playerData.id);
      if (exists) {
        return safePrev.map((p) => (p && p.id === playerData.id ? playerData : p));
      }
      return [...safePrev, playerData];
    });
    toast.success("Coterie atualizada na nuvem.");
  };

  const deletePlayer = {
    mutate: (id: string) => {
      setPlayers((prev) => (prev || []).filter((p) => p && p.id !== id));
      toast.success("Personagem removido.");
      setDialogOpen(false);
    },
  };

  const rollRouse = (playerId: string, currentHunger: number = 0) => {
    if (currentHunger >= 5) {
      toast.error("Frenesi absoluto. Um vampiro Fome 5 deve devorar, ou cairá em letargia.");
      return;
    }
    const result = Math.floor(Math.random() * 10) + 1;
    if (result <= 5) {
      handleQuickHungerUpdate(playerId, currentHunger + 1);
      toast.error(`Falha! Tirou ${result} no Despertar. Fome aumentou.`);
    } else {
      toast.success(`Êxito! Tirou ${result}. O Sangue se manteve domado.`);
    }
  };

  const validPlayers = (players || []).filter((p) => p && typeof p === "object");

  return (
    <ErrorBoundary fallbackTitle="Erro ao carregar a página da Coterie">
      <div>
        <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">A Coterie</h1>
              <p className="text-muted-foreground mt-1 text-sm">Gerenciar Fome, Humanidade e fichas dos Jogadores</p>
            </div>
          </div>
          <Button onClick={() => { setEditingPlayer(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Personagem
          </Button>
        </div>

        {validPlayers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-serif">Nenhum personagem na Coterie</p>
            <p className="text-sm mt-2">Adicione seu primeiro personagem para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validPlayers.map((player) => {
              const charName = (player.character_name || player.name || "Sem Nome").trim();
              const firstName = charName.split(" ")[0] || charName;

              const playerItems = (arsenal || []).filter(
                (item) => item && item.owner && (item.owner === charName || item.owner === firstName)
              );

              let stats = {
                bonusByTarget: {} as Record<string, number>,
              };
              try {
                stats = calculateCharacterStats(player, playerItems);
              } catch (err) {
                console.error(`Erro ao calcular atributos de ${charName}:`, err);
              }

              const safeHunger = Number.isFinite(player.hunger) ? player.hunger : 0;
              const safeHumanity = Number.isFinite(player.humanity) ? player.humanity : 7;
              const safeHealthCurr = Number.isFinite(player.health_current) ? player.health_current : 7;
              const safeHealthMax = Number.isFinite(player.health_max) ? player.health_max : player.health || 7;
              const safeWillCurr = Number.isFinite(player.willpower_current) ? player.willpower_current : 5;
              const safeWillMax = Number.isFinite(player.willpower_max) ? player.willpower_max : 5;
              const clanName = player.clan || "Sem Clã";

              return (
                <ErrorBoundary key={player.id || Math.random()} fallbackTitle={`Erro no card de ${charName}`}>
                  <div
                    className="bg-card border border-border rounded-lg hover:border-primary/40 transition-colors cursor-pointer group/card relative"
                    onClick={() => { setEditingPlayer(player); setDialogOpen(true); }}
                  >
                    <div className="aspect-[4/3] bg-muted overflow-hidden rounded-t-lg">
                      {player.image_url ? (
                        <img
                          src={player.image_url}
                          alt={charName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="font-serif text-4xl opacity-30">
                            {charName.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-serif font-semibold text-lg">{charName}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {[clanName, player.player_name && `(${player.player_name})`].filter(Boolean).join(" ")}
                        </p>
                      </div>

                      {/* Trackers de Fome e Humanidade com Quick Update */}
                      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-primary font-medium tracking-wider uppercase">Fome</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-4 w-4 bg-transparent border-blood/50 text-blood hover:bg-blood hover:text-white rounded-full flex items-center justify-center p-0"
                              title="Rouse Check (Despertar)"
                              onClick={(e) => {
                                e.stopPropagation();
                                rollRouse(player.id, safeHunger);
                              }}
                            >
                              <Zap className="w-2 h-2" />
                            </Button>
                          </div>
                          <HungerTracker
                            value={safeHunger}
                            size="sm"
                            onChange={(v) => handleQuickHungerUpdate(player.id, v)}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gold font-medium tracking-wider uppercase block mb-1">
                            Humanidade
                          </span>
                          <HumanityTracker
                            value={safeHumanity}
                            size="sm"
                            onChange={(v) => updateTracker.mutate({ id: player.id, field: "humanity", value: v })}
                          />
                        </div>
                      </div>

                      {/* Métricas Vitais Discretas com Formato +X (Verde) / -X (Vermelho) */}
                      <div className="pt-2 border-t border-border/30 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-blood/80" />
                            <span>Vitalidade:</span>
                            <span className="font-bold text-foreground">
                              {safeHealthCurr} /{" "}
                              <ModifiedValue
                                baseValue={safeHealthMax}
                                modValue={stats?.bonusByTarget?.["vitalidade"] || 0}
                              />
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3 text-blue-400/80" />
                            <span>Vontade:</span>
                            <span className="font-bold text-foreground">
                              {safeWillCurr} /{" "}
                              <ModifiedValue
                                baseValue={safeWillMax}
                                modValue={stats?.bonusByTarget?.["vontade"] || 0}
                              />
                            </span>
                          </div>
                        </div>

                        {/* Modificadores Ativos dos Itens no Personagem */}
                        {stats?.bonusByTarget && Object.keys(stats.bonusByTarget).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {Object.entries(stats.bonusByTarget).map(([target, val]) => (
                              <span
                                key={target}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                                  val > 0
                                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                                    : "bg-rose-950/40 border-rose-500/40 text-rose-400"
                                }`}
                              >
                                {target.toUpperCase()}: {val > 0 ? `+${val}` : val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Seção de Disciplinas (Tags JSONB com Nome e Nível) */}
                      <div className="pt-2 border-t border-border/40 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" /> Disciplinas
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(player.disciplines) && player.disciplines.length > 0 ? (
                            player.disciplines.map((disc: any, idx: number) => (
                              <Badge
                                key={disc?.id || idx}
                                variant="outline"
                                className="text-[10px] bg-background/60 border-blood/40 text-blood font-semibold py-0.5 px-2"
                              >
                                {disc?.nome || disc?.name || "Disciplina"} {disc?.nivel !== undefined ? disc.nivel : ""}
                              </Badge>
                            ))
                          ) : CLAN_DISCIPLINES[clanName]?.length ? (
                            CLAN_DISCIPLINES[clanName].map((disc, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[10px] bg-background/60 border-border/60 text-muted-foreground py-0.5 px-2"
                              >
                                {disc.name}
                              </Badge>
                            ))
                          ) : typeof player.disciplines === "string" && player.disciplines ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-background/60 border-blood/40 text-blood py-0.5 px-2"
                            >
                              {player.disciplines}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">
                              Nenhuma disciplina cadastrada.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inventário do Jogador com Detalhamento Rápido das Regras */}
                      <div className="pt-2 border-t border-border/40 mt-3">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Inventário Físico
                        </h4>
                        <div className="flex flex-col gap-1.5">
                          {playerItems.length > 0 ? (
                            playerItems.map((item) => {
                              const summaries = getItemSummary(item);
                              return (
                                <div
                                  key={item.id || Math.random()}
                                  className="flex flex-col bg-surface-container-low p-2 rounded border border-border/50 transition-colors"
                                >
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Crosshair className="w-3 h-3 text-blood opacity-80" /> {item.name || "Item"}
                                  </span>
                                  {summaries.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pl-4 mt-1">
                                      {summaries.map((sum, i) => (
                                        <span
                                          key={i}
                                          className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/30 font-mono"
                                        >
                                          {sum}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Nenhum artefato equipado.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              );
            })}
          </div>
        )}

        <PlayerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          player={editingPlayer}
          onSave={savePlayer}
          onDelete={(id) => deletePlayer.mutate(id)}
        />
      </div>
    </ErrorBoundary>
  );
}

function Brain(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    </svg>
  );
}
