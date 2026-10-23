import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateCharacterStats } from "@/utils/calculateCharacterStats";
import {
  Plus,
  Crosshair,
  Sparkles,
  Zap,
  Users,
  Heart,
  Ticket,
  UserCheck,
  Shield,
  Lock,
  Unlock,
  Radio,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HungerTracker } from "@/components/HungerTracker";
import { HumanityTracker } from "@/components/HumanityTracker";
import { PlayerDialog } from "@/components/PlayerDialog";
import { PlayerInviteModal } from "@/components/PlayerInviteModal";
import { toast } from "sonner";
import { getPrefixedKey, isGuestMode } from "@/components/ChronicleSwitcher";
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

function normalizePlayerData(row: any): any {
  if (!row || typeof row !== "object") return row;
  const sheet = row.sheet_data && typeof row.sheet_data === "object" ? row.sheet_data : {};
  return {
    ...sheet,
    ...row,
    // Garantir integridade de escalares
    id: row.id || sheet.id,
    character_name: row.character_name || sheet.character_name || "Sem Nome",
    clan: row.clan || sheet.clan || "Sem Clã",
    hunger: Number.isFinite(row.hunger) ? row.hunger : Number.isFinite(sheet.hunger) ? sheet.hunger : 0,
    humanity: Number.isFinite(row.humanity) ? row.humanity : Number.isFinite(sheet.humanity) ? sheet.humanity : 7,
    health_max: Number.isFinite(row.health_max) ? row.health_max : sheet.health_max || 7,
    health_current: Number.isFinite(row.health_current) ? row.health_current : sheet.health_current || 7,
    willpower_max: Number.isFinite(row.willpower_max) ? row.willpower_max : sheet.willpower_max || 5,
    willpower_current: Number.isFinite(row.willpower_current) ? row.willpower_current : sheet.willpower_current || 5,
    is_locked: Boolean(row.is_locked ?? sheet.is_locked ?? false),
  };
}

export default function CoteriePage() {
  const { user, isNarrator, isPlayer, activeChronicleId } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitingPlayer, setInvitingPlayer] = useState<any>(null);
  const [arsenal, setArsenal] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Espelha no localStorage para manter retrocompatibilidade com Combate, DiceRoller e outros widgets
  const mirrorToLocalStorage = useCallback((updatedList: any[]) => {
    try {
      const storageKey = getPrefixedKey("v5_coterie");
      window.localStorage.setItem(storageKey, JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Erro ao espelhar coterie no localStorage:", e);
    }
  }, []);

  // 1. Carrega Arsenal Físico do LocalStorage
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

  // 2. Busca de Personagens do Banco Supabase (ou Local no Modo Convidado)
  const fetchPlayers = useCallback(async () => {
    if (isGuestMode() || !user) {
      try {
        const local = localStorage.getItem(getPrefixedKey("v5_coterie"));
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) setPlayers(parsed.map(normalizePlayerData));
        }
      } catch (e) {
        console.error("Erro ao carregar coterie guest:", e);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from("players").select("*").order("created_at", { ascending: true });

      // Se houver crônica ativa selecionada, filtra por ela
      if (activeChronicleId && activeChronicleId !== "default") {
        query = query.eq("chronicle_id", activeChronicleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const normalized = (data || []).map(normalizePlayerData);
      setPlayers(normalized);
      mirrorToLocalStorage(normalized);
    } catch (err: any) {
      console.error("Erro ao carregar personagens da Coterie:", err);
      toast.error("Falha ao carregar fichas da crônica.");
    } finally {
      setLoading(false);
    }
  }, [user, activeChronicleId, mirrorToLocalStorage]);

  // 3. Efeito Principal de Carga e Subscription Realtime
  useEffect(() => {
    fetchPlayers();

    if (isGuestMode() || !user) {
      return;
    }

    // Configuração do Canal Realtime do Supabase
    const channelId = `coterie-realtime-${activeChronicleId || "global"}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
        },
        (payload) => {
          setRealtimeActive(true);

          if (payload.eventType === "INSERT") {
            const newRow = payload.new as any;
            if (activeChronicleId && activeChronicleId !== "default" && newRow.chronicle_id !== activeChronicleId) {
              return;
            }
            const normalized = normalizePlayerData(newRow);
            setPlayers((prev) => {
              if (prev.some((p) => p.id === normalized.id)) return prev;
              const next = [...prev, normalized];
              mirrorToLocalStorage(next);
              return next;
            });
            toast.info(`Novo personagem adicionado à Coterie: ${normalized.character_name}`);
          } else if (payload.eventType === "UPDATE") {
            const updatedRow = payload.new as any;
            const normalized = normalizePlayerData(updatedRow);
            setPlayers((prev) => {
              const next = prev.map((p) => (p.id === normalized.id ? { ...p, ...normalized } : p));
              mirrorToLocalStorage(next);
              return next;
            });
          } else if (payload.eventType === "DELETE") {
            const oldRow = payload.old as any;
            if (oldRow?.id) {
              setPlayers((prev) => {
                const next = prev.filter((p) => p.id !== oldRow.id);
                mirrorToLocalStorage(next);
                return next;
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeActive(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlayers, activeChronicleId, user, mirrorToLocalStorage]);

  // 4. Trava do Narrador (Lock / Unlock da ficha)
  const handleToggleLock = async (player: any) => {
    if (!isNarrator) {
      toast.error("Apenas o Narrador pode travar ou destravar fichas.");
      return;
    }

    const newLocked = !player.is_locked;

    // Atualização otimista
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, is_locked: newLocked } : p))
    );

    if (isGuestMode() || !user) {
      toast.success(newLocked ? "Ficha trancada (Modo Local)." : "Ficha destrancada (Modo Local).");
      return;
    }

    try {
      const { error } = await supabase
        .from("players")
        .update({ is_locked: newLocked })
        .eq("id", player.id);

      if (error) throw error;

      toast.success(
        newLocked
          ? `Ficha de ${player.character_name} trancada para o jogador.`
          : `Ficha de ${player.character_name} destrancada para edições.`
      );
    } catch (err: any) {
      console.error("Erro ao alterar trava da ficha:", err);
      toast.error(err.message || "Erro ao atualizar trava no banco.");
      fetchPlayers(); // Reverte em caso de falha
    }
  };

  // 5. Atualização Rápida de Fome (Quick Hunger)
  const handleQuickHungerUpdate = async (player: any, newHunger: number) => {
    if (isPlayer && player.is_locked) {
      toast.error("Sua ficha está trancada pelo Narrador. Alterações de Fome bloqueadas.");
      return;
    }

    const safeHunger = Math.max(0, Math.min(5, newHunger));

    // Atualização otimista
    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, hunger: safeHunger } : p))
    );

    if (isGuestMode() || !user) {
      toast.success(`Fome alterada para ${safeHunger}.`);
      return;
    }

    try {
      const { error } = await supabase
        .from("players")
        .update({ hunger: safeHunger, updated_at: new Date().toISOString() })
        .eq("id", player.id);

      if (error) throw error;
      toast.success(`Fome alterada para ${safeHunger}.`);
    } catch (e: any) {
      console.error("Erro ao atualizar Fome no Supabase:", e);
      toast.error("Erro ao atualizar Fome no banco.");
      fetchPlayers();
    }
  };

  // 6. Atualização Rápida de Humanidade
  const handleQuickHumanityUpdate = async (player: any, newHumanity: number) => {
    if (isPlayer && player.is_locked) {
      toast.error("Sua ficha está trancada pelo Narrador. Alterações bloqueadas.");
      return;
    }

    const safeHumanity = Math.max(0, Math.min(10, newHumanity));

    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, humanity: safeHumanity } : p))
    );

    if (isGuestMode() || !user) return;

    try {
      const { error } = await supabase
        .from("players")
        .update({ humanity: safeHumanity, updated_at: new Date().toISOString() })
        .eq("id", player.id);

      if (error) throw error;
      toast.success(`Humanidade ajustada para ${safeHumanity}.`);
    } catch (e: any) {
      console.error("Erro ao atualizar Humanidade:", e);
      fetchPlayers();
    }
  };

  // 7. Rouse Check (Despertar do Sangue)
  const rollRouse = (player: any) => {
    if (isPlayer && player.is_locked) {
      toast.error("Sua ficha está trancada pelo Narrador. O Despertar não pode ser acionado.");
      return;
    }

    const currentHunger = Number(player.hunger) || 0;
    if (currentHunger >= 5) {
      toast.error("Frenesi absoluto! Com Fome 5, o Sangue exige alimento ou causará Letargia.");
      return;
    }

    const result = Math.floor(Math.random() * 10) + 1;
    if (result <= 5) {
      handleQuickHungerUpdate(player, currentHunger + 1);
      toast.error(`Falha no Despertar (Dado: ${result}). A Besta se agita e a Fome subiu para ${currentHunger + 1}!`);
    } else {
      toast.success(`Sucesso no Despertar (Dado: ${result})! O Sangue permaneceu calmo.`);
    }
  };

  // 8. Salvar Personagem Completo (via Modal)
  const savePlayer = async (playerData: any) => {
    if (!playerData) return;

    const normalized = normalizePlayerData(playerData);

    // Atualização otimista local
    setPlayers((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.find((p) => p && p.id === normalized.id);
      const next = exists
        ? safePrev.map((p) => (p && p.id === normalized.id ? normalized : p))
        : [...safePrev, normalized];
      mirrorToLocalStorage(next);
      return next;
    });

    if (isGuestMode() || !user) {
      toast.success("Personagem salvo no armazenamento local.");
      return;
    }

    try {
      const dbPayload: any = {
        id: normalized.id,
        character_name: (normalized.character_name || "").trim(),
        player_name: normalized.player_name || null,
        clan: normalized.clan || null,
        sire: normalized.sire || null,
        generation: Number(normalized.generation) || 13,
        hunger: Number(normalized.hunger) || 0,
        humanity: Number(normalized.humanity) || 7,
        health_max: Number(normalized.health_max) || 7,
        health_current: Number(normalized.health_current) || 7,
        willpower_max: Number(normalized.willpower_max) || 5,
        willpower_current: Number(normalized.willpower_current) || 5,
        human_history: normalized.human_history || null,
        embrace_story: normalized.embrace_story || null,
        image_url: normalized.image_url || null,
        disciplines:
          typeof normalized.disciplines === "string"
            ? normalized.disciplines
            : JSON.stringify(normalized.disciplines || []),
        sheet_data: playerData,
        updated_at: new Date().toISOString(),
      };

      if (activeChronicleId && activeChronicleId !== "default") {
        dbPayload.chronicle_id = activeChronicleId;
      }

      // Se for jogador criando a ficha própria, vincula o user.id
      if (isPlayer) {
        dbPayload.player_id = user.id;
        dbPayload.is_locked = false;
      }

      const { error } = await supabase.from("players").upsert(dbPayload);

      if (error) throw error;
      toast.success("Ficha sincronizada no Supabase.");
    } catch (err: any) {
      console.error("Erro ao salvar personagem no Supabase:", err);
      toast.error(err.message || "Erro ao salvar ficha no banco.");
      fetchPlayers();
    }
  };

  // 9. Exclusão de Personagem
  const deletePlayer = async (id: string) => {
    setPlayers((prev) => {
      const next = (prev || []).filter((p) => p && p.id !== id);
      mirrorToLocalStorage(next);
      return next;
    });

    if (!isGuestMode() && user) {
      try {
        const { error } = await supabase.from("players").delete().eq("id", id);
        if (error) throw error;
        toast.success("Personagem removido da crônica.");
      } catch (err: any) {
        console.error("Erro ao excluir personagem:", err);
        toast.error("Erro ao remover personagem do banco.");
        fetchPlayers();
      }
    } else {
      toast.success("Personagem removido localmente.");
    }

    setDialogOpen(false);
  };

  const validPlayers = (players || []).filter((p) => p && typeof p === "object");

  return (
    <ErrorBoundary fallbackTitle="Erro ao carregar a página da Coterie">
      <div className="space-y-6">
        {/* Cabeçalho Unificado com Identificação Dinâmica de Papel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-950/40 rounded-lg border border-red-900/50 shadow-[0_0_15px_rgba(185,28,28,0.2)]">
              {isPlayer ? (
                <Shield className="w-6 h-6 text-red-400" />
              ) : (
                <Users className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-red-900/60 bg-red-950/40 text-red-400"
                >
                  {isPlayer ? "Visão do Membro" : "Visão do Narrador"}
                </Badge>
                {realtimeActive && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-emerald-900/60 bg-emerald-950/30 text-emerald-400 flex items-center gap-1"
                  >
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                    Tempo Real Ativo
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                {isPlayer ? "Santuário do Membro" : "A Coterie"}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
                {isPlayer
                  ? "Sua ficha oficial V5 com sincronia mágica e regras da Máscara"
                  : "Gerenciar Fome, Humanidade, Trava do Narrador e fichas dos Jogadores"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* O Narrador sempre pode criar personagens. O Jogador pode criar se ainda não possuir nenhum */}
            {(isNarrator || (isPlayer && validPlayers.length === 0)) && (
              <Button
                onClick={() => {
                  setEditingPlayer(null);
                  setDialogOpen(true);
                }}
                className="gap-2 bg-red-900 hover:bg-red-800 text-white font-serif tracking-wide shadow-[0_0_15px_rgba(185,28,28,0.3)]"
              >
                <Plus className="w-4 h-4" /> Novo Personagem
              </Button>
            )}
          </div>
        </div>

        {/* Estado Vazio para Jogador sem Personagem */}
        {validPlayers.length === 0 && !loading && (
          <div className="text-center py-16 px-4 bg-card/40 border border-dashed border-border/60 rounded-xl max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(185,28,28,0.25)]">
              {isPlayer ? <Shield className="w-7 h-7" /> : <Users className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-foreground">
                {isPlayer ? "Nenhum personagem vinculado ao seu usuário" : "Nenhum personagem na Coterie"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {isPlayer
                  ? "Você ainda não possui uma ficha nesta crônica. Crie seu primeiro personagem agora ou solicite um código de convite ao seu Narrador para resgatar sua ficha no Saguão."
                  : "Adicione os personagens dos seus jogadores ou resgate fichas via código de convite."}
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPlayer(null);
                setDialogOpen(true);
              }}
              className="gap-2 bg-red-900 hover:bg-red-800 text-white font-serif tracking-wide shadow-[0_0_15px_rgba(185,28,28,0.3)]"
            >
              <Plus className="w-4 h-4" /> Criar Meu Personagem
            </Button>
          </div>
        )}

        {/* Grid de Personagens */}
        {validPlayers.length > 0 && (
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
              const isLocked = Boolean(player.is_locked);

              return (
                <ErrorBoundary key={player.id || Math.random()} fallbackTitle={`Erro no card de ${charName}`}>
                  <div
                    className={`bg-card border rounded-lg transition-all cursor-pointer group/card relative overflow-hidden ${
                      isLocked
                        ? "border-amber-900/50 hover:border-amber-700/60 shadow-[0_0_15px_rgba(217,119,6,0.08)]"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => {
                      setEditingPlayer(player);
                      setDialogOpen(true);
                    }}
                  >
                    {/* Imagem do Personagem */}
                    <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                      {player.image_url ? (
                        <img
                          src={player.image_url}
                          alt={charName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-zinc-950">
                          <span className="font-serif text-4xl opacity-30">
                            {charName.charAt(0) || "?"}
                          </span>
                        </div>
                      )}

                      {/* Badge Flutuante de Trava da Ficha */}
                      {isLocked && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono bg-black/85 border-amber-600/80 text-amber-300 flex items-center gap-1 shadow-md py-0.5 px-2"
                          >
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Edição Trancada</span>
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        {/* Linha Superior de Ações: Status, Convite e Trava do Narrador */}
                        <div
                          className="flex items-center justify-between mb-2 gap-2 flex-wrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {player.player_id ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-950/40 border-emerald-800/60 text-emerald-400 font-mono flex items-center gap-1 py-0 px-1.5"
                              >
                                <UserCheck className="w-2.5 h-2.5" /> Vinculado
                              </Badge>
                            ) : player.invite_token ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-amber-950/40 border-amber-800/60 text-amber-400 font-mono py-0 px-1.5"
                              >
                                Convite: {player.invite_token}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400 font-mono py-0 px-1.5"
                              >
                                Sem Convite
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* BOTÃO DA TRAVA DO NARRADOR */}
                            {isNarrator && (
                              <Button
                                size="sm"
                                variant="outline"
                                className={`h-6 text-[10px] font-mono px-2 gap-1 transition-colors ${
                                  isLocked
                                    ? "border-amber-800/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200"
                                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLock(player);
                                }}
                                title={
                                  isLocked
                                    ? "Destravar ficha (Permitir edições do jogador)"
                                    : "Travar ficha (Bloquear edições do jogador)"
                                }
                              >
                                {isLocked ? (
                                  <>
                                    <Lock className="w-3 h-3 text-amber-400" /> Trancada
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3 text-zinc-400" /> Aberta
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Botão de Convite (Visível apenas para o Narrador) */}
                            {isNarrator && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] font-mono px-2 border-red-900/50 bg-red-950/20 text-red-300 hover:bg-red-950/50 hover:text-red-200 gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInvitingPlayer(player);
                                  setInviteModalOpen(true);
                                }}
                                title="Gerar / Ver Convite do Jogador"
                              >
                                <Ticket className="w-3 h-3 text-red-400" /> Convite
                              </Button>
                            )}
                          </div>
                        </div>

                        <h3 className="font-serif font-semibold text-lg text-foreground flex items-center justify-between">
                          <span>{charName}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {[clanName, player.player_name && `(${player.player_name})`].filter(Boolean).join(" ")}
                        </p>
                      </div>

                      {/* Trackers de Fome e Humanidade com Quick Update */}
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg bg-surface-container-low/40 border border-border/30 ${
                          isPlayer && isLocked ? "opacity-75" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-primary font-medium tracking-wider uppercase">Fome</span>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={isPlayer && isLocked}
                              className={`h-4 w-4 bg-transparent border-blood/50 text-blood hover:bg-blood hover:text-white rounded-full flex items-center justify-center p-0 ${
                                isPlayer && isLocked ? "cursor-not-allowed opacity-50" : ""
                              }`}
                              title={
                                isPlayer && isLocked
                                  ? "Ficha trancada pelo Narrador"
                                  : "Rouse Check (Despertar)"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                rollRouse(player);
                              }}
                            >
                              <Zap className="w-2 h-2" />
                            </Button>
                          </div>
                          <HungerTracker
                            value={safeHunger}
                            size="sm"
                            onChange={
                              isPlayer && isLocked
                                ? undefined
                                : (v) => handleQuickHungerUpdate(player, v)
                            }
                          />
                        </div>
                        <div>
                          <span className="text-xs text-gold font-medium tracking-wider uppercase block mb-1 text-right">
                            Humanidade
                          </span>
                          <HumanityTracker
                            value={safeHumanity}
                            size="sm"
                            onChange={
                              isPlayer && isLocked
                                ? undefined
                                : (v) => handleQuickHumanityUpdate(player, v)
                            }
                          />
                        </div>
                      </div>

                      {/* Métricas Vitais: Vitalidade e Força de Vontade */}
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

                      {/* Seção de Disciplinas */}
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

                      {/* Inventário Físico */}
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

        {/* Modal de Edição Completa da Ficha V5 */}
        <PlayerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          player={editingPlayer}
          onSave={savePlayer}
          onDelete={isNarrator ? (id) => deletePlayer(id) : undefined}
          isReadOnly={isPlayer && Boolean(editingPlayer?.is_locked)}
        />

        {/* Modal de Convite para o Narrador */}
        <PlayerInviteModal
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          player={invitingPlayer}
          onUpdatePlayer={(updated) => {
            savePlayer(updated);
            setInvitingPlayer(updated);
          }}
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
