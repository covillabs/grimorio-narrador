import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { useDicePool } from "@/hooks/useDicePool";
import { supabase } from "@/integrations/supabase/client";
import { Sword, Trash2, Heart, Skull, ShieldBan, Crosshair, Zap, Dices, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getPrefixedKey } from "@/components/ChronicleSwitcher";

type Combatant = {
  id: string;
  name: string;
  type: "player" | "npc" | "custom";
  physical_pool?: number;
  social_pool?: number;
  mental_pool?: number;
  max_hp: number;
  max_wp: number;
  sup_dmg: number;
  agr_dmg: number;
  fw_sup: number;
  fw_agr: number;
  npcRefId?: string;
};

export default function CombatePage() {
  const [combatants, setCombatants] = useCloudStorage<Combatant[]>("v5_arena", []);
  const [items] = useCloudStorage<any[]>("v5_arsenal", []);

  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [availableNpcs, setAvailableNpcs] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [isEndingCombat, setIsEndingCombat] = useState<boolean>(false);

  // Estado para gerenciar Toggles Ativos por Combatente { combatantId: { conditionKey: boolean } }
  const [activeConditionsMap, setActiveConditionsMap] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const p = localStorage.getItem(getPrefixedKey("v5_coterie"));
    if (p) setAvailablePlayers(JSON.parse(p));
    const n = localStorage.getItem(getPrefixedKey("v5_npcs"));
    if (n) setAvailableNpcs(JSON.parse(n));
  }, []);

  const handleImport = () => {
    if (!selectedEntity) return;
    const isPlayer = selectedEntity.startsWith("p_");
    const realId = selectedEntity.replace(/^(p|n)_/, "");
    
    let source = isPlayer ? availablePlayers : availableNpcs;
    let entity = source.find((e: any) => e.id === realId);
    
    if (entity) {
      const name = isPlayer ? entity.character_name : entity.name;
      addCombatant({
        id: Date.now().toString(),
        name,
        type: isPlayer ? "player" : "npc",
        physical_pool: entity.physical_pool || 4,
        social_pool: entity.social_pool || 3,
        mental_pool: entity.mental_pool || 3,
        max_hp: entity.health || 6,
        max_wp: 5,
        sup_dmg: entity.sup_dmg || 0,
        agr_dmg: entity.agr_dmg || 0,
        fw_sup: entity.fw_sup || 0,
        fw_agr: entity.fw_agr || 0,
        npcRefId: entity.id
      });
      setSelectedEntity("");
    }
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addCombatant({
      id: Date.now().toString(),
      name: customName,
      type: "custom",
      physical_pool: 4,
      social_pool: 3,
      mental_pool: 3,
      max_hp: 5, max_wp: 4,
      sup_dmg: 0, agr_dmg: 0, fw_sup: 0, fw_agr: 0
    });
    setCustomName("");
  };

  const addCombatant = (c: Combatant) => {
    setCombatants(prev => [...prev, c]);
    toast.success(`${c.name} entrou na Arena.`);
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  // Função para Encerrar Combate e Atualizar Supabase (Batch / Promise.all)
  const handleEndCombat = async () => {
    if (combatants.length === 0) {
      toast("A arena já está vazia.");
      return;
    }

    setIsEndingCombat(true);

    try {
      // 1. Filtrar apenas personagens oficiais (PLAYER e OFFICIAL_NPC / NPC)
      // Ameaças abruptas (CUSTOM / type === 'custom') são ignoradas completamente
      const officialCombatants = combatants.filter(
        (c) => (c.type === "player" || c.type === "npc") && c.npcRefId
      );

      if (officialCombatants.length > 0) {
        // 2. Promessas em paralelo para atualizar Supabase e LocalStorage
        const updatePromises = officialCombatants.map(async (c) => {
          const targetId = c.npcRefId!;

          if (c.type === "player") {
            // Atualiza no Supabase
            const { error } = await supabase
              .from("players")
              .update({
                sup_dmg: c.sup_dmg,
                agr_dmg: c.agr_dmg,
                fw_sup: c.fw_sup,
                fw_agr: c.fw_agr,
              })
              .eq("id", targetId);

            if (error) {
              console.error(`Erro ao atualizar jogador no Supabase (${c.name}):`, error);
            }

            // Atualiza cache local de jogadores (coterie)
            const coterieKey = getPrefixedKey("v5_coterie");
            const rawPlayers = localStorage.getItem(coterieKey);
            if (rawPlayers) {
              const parsed = JSON.parse(rawPlayers);
              const updated = parsed.map((p: any) =>
                p.id === targetId
                  ? { ...p, sup_dmg: c.sup_dmg, agr_dmg: c.agr_dmg, fw_sup: c.fw_sup, fw_agr: c.fw_agr }
                  : p
              );
              localStorage.setItem(coterieKey, JSON.stringify(updated));
            }
          } else if (c.type === "npc") {
            // Atualiza no Supabase
            const { error } = await supabase
              .from("npcs")
              .update({
                sup_dmg: c.sup_dmg,
                agr_dmg: c.agr_dmg,
                fw_sup: c.fw_sup,
                fw_agr: c.fw_agr,
                health: c.max_hp,
              })
              .eq("id", targetId);

            if (error) {
              console.error(`Erro ao atualizar NPC no Supabase (${c.name}):`, error);
            }

            // Atualiza cache local de NPCs
            const npcsKey = getPrefixedKey("v5_npcs");
            const rawNpcs = localStorage.getItem(npcsKey);
            if (rawNpcs) {
              const parsed = JSON.parse(rawNpcs);
              const updated = parsed.map((n: any) =>
                n.id === targetId
                  ? { ...n, sup_dmg: c.sup_dmg, agr_dmg: c.agr_dmg, fw_sup: c.fw_sup, fw_agr: c.fw_agr, health: c.max_hp }
                  : n
              );
              localStorage.setItem(npcsKey, JSON.stringify(updated));
            }
          }
        });

        // Executa todas as atualizações simultaneamente
        await Promise.all(updatePromises);
      }

      // 3. Limpa o painel de combate e exibe toast de sucesso
      setCombatants([]);
      setActiveConditionsMap({});
      toast.success("Combate encerrado e fichas atualizadas!", {
        description: officialCombatants.length > 0
          ? `${officialCombatants.length} fichas oficiais foram salvas.`
          : "Nenhum personagem oficial precisou de alteração.",
      });
    } catch (err: any) {
      console.error("Erro ao encerrar combate:", err);
      toast.error("Erro ao sincronizar fichas com o Supabase.");
    } finally {
      setIsEndingCombat(false);
    }
  };

  const addSuperficialDmg = (combatantId: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== combatantId) return c;

        // Se o dano agravado já estiver no máximo (Derrotado/Morte Final), ignora
        if (c.agr_dmg >= c.max_hp) return c;

        const currentTotal = c.sup_dmg + c.agr_dmg;

        // Lógica de Conversão (Rollover V5):
        // Se a trilha estiver 100% cheia e o narrador adicionar +1 Superficial,
        // converte 1 Superficial existente em 1 Agravado.
        if (currentTotal >= c.max_hp) {
          if (c.sup_dmg > 0) {
            const newAgr = Math.min(c.max_hp, c.agr_dmg + 1);
            const newSup = Math.max(0, c.sup_dmg - 1);

            if (newAgr >= c.max_hp) {
              toast.error(`${c.name} sofreu colapso total (TORPOR / MORTE FINAL)!`, {
                description: "Todo o dano foi convertido em Agravado.",
              });
            } else {
              toast.warning(`Trilha cheia! 1 Dano Superficial convertido em AGRAVADO para ${c.name}.`);
            }

            return { ...c, sup_dmg: newSup, agr_dmg: newAgr };
          }
          return c;
        }

        return { ...c, sup_dmg: c.sup_dmg + 1 };
      })
    );
  };

  const subSuperficialDmg = (combatantId: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== combatantId) return c;
        return { ...c, sup_dmg: Math.max(0, c.sup_dmg - 1) };
      })
    );
  };

  const addAggravatedDmg = (combatantId: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== combatantId) return c;

        if (c.agr_dmg >= c.max_hp) return c;

        const newAgr = Math.min(c.max_hp, c.agr_dmg + 1);
        const newSup = Math.min(c.sup_dmg, c.max_hp - newAgr);

        if (newAgr >= c.max_hp) {
          toast.error(`${c.name} FOI DERROTADO (TORPOR / MORTE FINAL)!`, {
            description: "Dano Agravado atingiu o valor máximo.",
          });
        } else {
          toast.warning(`Dano Agravado aplicado a ${c.name}.`);
        }

        return { ...c, sup_dmg: newSup, agr_dmg: newAgr };
      })
    );
  };

  const subAggravatedDmg = (combatantId: string) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== combatantId) return c;
        return { ...c, agr_dmg: Math.max(0, c.agr_dmg - 1) };
      })
    );
  };

  const toggleCondition = (combatantId: string, conditionKey: string) => {
    setActiveConditionsMap(prev => {
      const current = prev[combatantId] || {};
      const nextState = !current[conditionKey];
      toast(nextState ? `Condição ativada!` : `Condição desativada`, {
        description: `${conditionKey}`,
      });
      return {
        ...prev,
        [combatantId]: {
          ...current,
          [conditionKey]: nextState
        }
      };
    });
  };

  // Renderizador de Dano com Suporte a Desabilitação quando Derrotado
  const DmgBlock = ({
    label,
    value,
    onAdd,
    onSub,
    isAgr,
    addDisabled,
  }: {
    label: string;
    value: number;
    onAdd: () => void;
    onSub: () => void;
    isAgr?: boolean;
    addDisabled?: boolean;
  }) => (
    <div className="flex flex-col items-center bg-background p-1.5 rounded border border-border/50">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={onSub}
          className="w-5 h-5 flex items-center justify-center bg-muted rounded hover:bg-destructive/30 hover:text-white transition-colors"
        >
          -
        </button>
        <span className={`font-mono font-bold w-4 text-center ${isAgr ? "text-red-500" : "text-blue-400"}`}>
          {value}
        </span>
        <button
          onClick={onAdd}
          disabled={addDisabled}
          className="w-5 h-5 flex items-center justify-center bg-muted rounded hover:bg-blood hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-muted disabled:hover:text-current"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto pb-10">
      <div className="mb-6 flex justify-between items-center border-b border-blood/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blood/10 rounded-lg border border-blood/20">
            <Sword className="w-6 h-6 text-blood" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-blood-glow">Arena de Sangue</h1>
            <p className="text-muted-foreground mt-1 text-sm">Painel Tático de Conflito em Turnos com Regras Oficiais V5</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleEndCombat}
            disabled={isEndingCombat}
            className="border-destructive text-destructive hover:bg-destructive hover:text-white h-9 text-xs"
          >
            {isEndingCombat ? "Sincronizando..." : "Encerrar Combate"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
         <div className="flex-1 bg-surface-container-low p-4 rounded-lg border border-border flex items-end gap-3 shadow-lg">
            <div className="flex-1 space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
                 <Crosshair className="w-3 h-3" /> Invocar Personagem Oficial
               </label>
               <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="border-border">
                     <SelectValue placeholder="Selecione Coterie ou SPC..." />
                  </SelectTrigger>
                  <SelectContent>
                     {availablePlayers.length > 0 && <SelectItem value="header_p" disabled className="font-bold text-blood">-- Coterie --</SelectItem>}
                     {availablePlayers.map(p => <SelectItem key={`p_${p.id}`} value={`p_${p.id}`}>{p.character_name}</SelectItem>)}
                     
                     {availableNpcs.length > 0 && <SelectItem value="header_n" disabled className="font-bold text-blood mt-2">-- Relatório SPC --</SelectItem>}
                     {availableNpcs.map(n => <SelectItem key={`n_${n.id}`} value={`n_${n.id}`}>{n.name}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>
            <Button onClick={handleImport} className="bg-primary hover:bg-primary/80">Invocar</Button>
         </div>

         <div className="flex-1 bg-surface-container-low p-4 rounded-lg border border-border flex items-end gap-3 shadow-lg">
            <div className="flex-1 space-y-2">
               <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1">
                 <Skull className="w-3 h-3 text-red-500" /> Ameaça Abrupta (Ad Hoc)
               </label>
               <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Ex: Segurança Blindado, Vampiro Anarquista..." className="border-border" />
            </div>
            <Button onClick={handleAddCustom} variant="secondary" className="bg-muted hover:bg-red-950 hover:text-white border border-border">Aparecer</Button>
         </div>
      </div>

      {combatants.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 border-2 border-dashed border-border rounded-lg py-20">
           <ShieldBan className="w-16 h-16 mb-4" />
           <p className="font-serif text-xl">A rua está silenciosa.</p>
           <p className="text-sm">Invoque ameaças para iniciar o banho de sangue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {combatants.map(c => (
              <CombatantCard
                key={c.id}
                combatant={c}
                items={items}
                activeConditions={activeConditionsMap[c.id] || {}}
                onToggleCondition={(key) => toggleCondition(c.id, key)}
                onRemove={() => removeCombatant(c.id)}
                onAddSuperficial={() => addSuperficialDmg(c.id)}
                onSubSuperficial={() => subSuperficialDmg(c.id)}
                onAddAggravated={() => addAggravatedDmg(c.id)}
                onSubAggravated={() => subAggravatedDmg(c.id)}
                onUpdateWp={(field, delta) => updateDmg(c.id, field, delta)}
                DmgBlock={DmgBlock}
              />
           ))}
        </div>
      )}
    </div>
  );
}

interface CombatantCardProps {
  combatant: Combatant;
  items: any[];
  activeConditions: Record<string, boolean>;
  onToggleCondition: (key: string) => void;
  onRemove: () => void;
  onAddSuperficial: () => void;
  onSubSuperficial: () => void;
  onAddAggravated: () => void;
  onSubAggravated: () => void;
  onUpdateWp: (field: keyof Combatant, delta: number) => void;
  DmgBlock: any;
}

function CombatantCard({
  combatant: c,
  items,
  activeConditions,
  onToggleCondition,
  onRemove,
  onAddSuperficial,
  onSubSuperficial,
  onAddAggravated,
  onSubAggravated,
  onUpdateWp,
  DmgBlock,
}: CombatantCardProps) {
  // Estado do Modo Simplificado: True por padrão para Ameaças Abruptas (Custom), False para Personagens Oficiais
  const [isSimplifiedMode, setIsSimplifiedMode] = useState<boolean>(c.type === "custom");

  // 1. Filtrar itens pertencentes a este combatente
  const equippedItems = items.filter(
    (item) =>
      (item.owner && item.owner.toLowerCase() === c.name.toLowerCase()) ||
      (c.npcRefId && item.owner_id === c.npcRefId)
  );

  // 2. Coletar modificadores condicionais presentes nos itens
  const conditionalModifiers: Array<{
    id: string;
    conditionName: string;
    target: string;
    value: number;
    sourceItem: string;
  }> = [];

  equippedItems.forEach((item) => {
    let rulesList: any[] = [];
    if (Array.isArray(item.rules_bonus)) {
      rulesList = item.rules_bonus;
    } else if (typeof item.rules_bonus === "string" && item.rules_bonus.startsWith("[")) {
      try { rulesList = JSON.parse(item.rules_bonus); } catch {}
    }

    rulesList.forEach((rule) => {
      if (rule.modifiers && Array.isArray(rule.modifiers)) {
        rule.modifiers.forEach((mod: any) => {
          if (mod.isConditional || mod.condicional) {
            const name = mod.conditionKey || mod.nome_condicao || rule.title || "Gatilho Especial";
            conditionalModifiers.push({
              id: mod.id || rule.id,
              conditionName: name,
              target: mod.target || "Combate",
              value: mod.value || 0,
              sourceItem: item.name || "Item",
            });
          }
        });
      }
    });
  });

  // 3. Estado Derivado (computed) de Morte/Torpor (V5 vs Modo Simplificado)
  const totalDamage = c.sup_dmg + c.agr_dmg;
  const isDefeated = isSimplifiedMode ? totalDamage >= c.max_hp : c.agr_dmg >= c.max_hp;
  const isImpaired = !isSimplifiedMode && totalDamage >= c.max_hp && !isDefeated;

  // 4. Hook customizado para calcular a Parada de Combate em Tempo Real
  const combatPool = useDicePool({
    npc: { physical_pool: c.physical_pool || 4 },
    items: equippedItems,
    poolType: "Combate",
    activeConditions,
  });

  return (
    <div
      className={`bg-card p-4 rounded-lg border-2 transition-all relative group flex flex-col justify-between space-y-4 ${
        isDefeated
          ? "border-blood shadow-[0_0_25px_rgba(185,28,28,0.35)] bg-red-950/20"
          : c.type === "player"
          ? "border-blue-900/40 shadow-[0_0_15px_rgba(30,58,138,0.1)]"
          : "border-red-900/40 shadow-[0_0_15px_rgba(153,27,27,0.1)]"
      }`}
    >
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remover da Arena"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div>
        <div className="flex items-center justify-between gap-2 mb-3 pr-6">
          <div className="flex items-center gap-2 truncate">
            <Badge
              variant="outline"
              className={`text-[10px] uppercase ${
                c.type === "player" ? "text-blue-400 border-blue-900" : "text-red-400 border-red-900"
              }`}
            >
              {c.type}
            </Badge>
            <h3 className={`font-serif font-bold text-lg truncate ${isDefeated ? "text-blood-glow line-through opacity-80" : ""}`}>
              {c.name}
            </h3>
          </div>

          {/* Toggle Switch para Modo Simplificado vs V5 Completo */}
          <button
            type="button"
            onClick={() => setIsSimplifiedMode(!isSimplifiedMode)}
            className={`text-[9px] px-2 py-0.5 rounded border font-mono transition-colors flex items-center gap-1 shrink-0 ${
              isSimplifiedMode
                ? "bg-amber-950/40 border-amber-500/50 text-amber-400 hover:bg-amber-900/50"
                : "bg-surface-container-high border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            title={isSimplifiedMode ? "Alternar para Regras Completas V5 (Superficial/Agravado)" : "Alternar para Modo Simplificado (Dano Único)"}
          >
            {isSimplifiedMode ? "⚡ Simplificado" : "📜 V5 Completo"}
          </button>
        </div>

        {/* Badge de Status V5 / Derrotado */}
        {isDefeated ? (
          <div className="mb-3">
            <Badge
              variant="destructive"
              className="text-[10px] bg-blood text-white font-extrabold px-2 py-0.5 tracking-wider uppercase animate-pulse border border-red-500 flex items-center w-fit"
            >
              <Skull className="w-3 h-3 mr-1" /> TORPOR / MORTE
            </Badge>
          </div>
        ) : isImpaired ? (
          <div className="mb-3">
            <Badge variant="destructive" className="text-[10px] animate-pulse w-fit">
              -2 DADOS (Impair)
            </Badge>
          </div>
        ) : null}

        {/* Banner do Estado Crítico quando Derrotado */}
        {isDefeated && (
          <div className="bg-red-950/80 border border-blood/60 p-2.5 rounded-md text-center text-xs space-y-1 mb-4 shadow-lg">
            <div className="flex items-center justify-center gap-1.5 font-serif font-bold text-blood-glow uppercase tracking-wider">
              <Skull className="w-4 h-4 text-blood" /> ESTADO CRÍTICO: TORPOR / MORTE
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isSimplifiedMode
                ? "Dano Recebido atingiu 100% da Vitalidade."
                : "Dano Agravado atingiu 100% da Vitalidade."}
            </p>
          </div>
        )}

        {/* HUD de Parada de Dados Calculada em Tempo Real */}
        <div className="bg-surface-container-low p-3 rounded border border-border/60 flex items-center justify-between mb-4 shadow-inner">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-primary animate-bounce" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground block">
                Parada de Combate
              </span>
              <span className="text-[11px] text-muted-foreground">
                Base ({combatPool.basePool}) {combatPool.itemBonus >= 0 ? `+ ${combatPool.itemBonus}` : `- ${Math.abs(combatPool.itemBonus)}`} itens
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-serif font-extrabold text-primary tracking-wider">
              {Math.max(0, combatPool.totalPool - (isImpaired ? 2 : 0))} <span className="text-xs text-muted-foreground font-sans">d10</span>
            </span>
          </div>
        </div>

        {/* Toggles Dinâmicos de Condições */}
        {conditionalModifiers.length > 0 && (
          <div className="space-y-2 mb-4 bg-muted/20 p-2.5 rounded border border-border/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blood" /> Toggles de Condições & Habilidades:
            </span>
            <div className="space-y-1.5">
              {conditionalModifiers.map((mod) => {
                const isActive = !!activeConditions[mod.conditionName];
                return (
                  <label
                    key={mod.id + mod.conditionName}
                    className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                      isActive
                        ? "bg-primary/15 border-primary/50 text-foreground shadow-sm"
                        : "bg-background/60 border-border/40 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap
                        className={`w-3.5 h-3.5 ${
                          isActive ? "text-primary fill-primary animate-pulse" : "text-muted-foreground/60"
                        }`}
                      />
                      <div>
                        <span className="font-semibold block text-[11px] text-foreground">
                          {mod.conditionName}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">
                          Item: {mod.sourceItem} ({mod.target}: {mod.value >= 0 ? `+${mod.value}` : mod.value} d10)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={(e) => {
                        e.preventDefault();
                        onToggleCondition(mod.conditionName);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Trilhas de Danos de Vitalidade e Vontade */}
        <div className="space-y-3">
          {/* Trilha de Vitalidade (Modo Simplificado vs V5 Completo) */}
          <div
            className={`bg-surface-container-low p-2 rounded border transition-colors ${
              isDefeated
                ? "border-blood bg-red-950/40 shadow-[inset_0_0_15px_rgba(185,28,28,0.3)]"
                : isImpaired
                ? "border-destructive/80 bg-red-950/20"
                : "border-border/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Heart className="w-3 h-3 text-blood" /> Trilha de Vitalidade {isSimplifiedMode ? "(Rápida)" : "(V5)"}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateWp("max_hp", -1)}
                  className="text-muted-foreground hover:text-white"
                >
                  -
                </button>
                <span className="text-[10px] font-mono mx-1">Max: {c.max_hp}</span>
                <button
                  onClick={() => onUpdateWp("max_hp", 1)}
                  className="text-muted-foreground hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {isSimplifiedMode ? (
              /* Modo Simplificado: Contador Único de Dano Recebido */
              <div className="bg-background p-2 rounded border border-amber-500/30 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 shrink-0">
                  Dano Recebido
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onSubSuperficial}
                    className="w-6 h-6 flex items-center justify-center bg-muted rounded hover:bg-destructive/30 hover:text-white transition-colors font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-extrabold text-sm whitespace-nowrap text-amber-400 min-w-[45px] text-center">
                    {totalDamage} / {c.max_hp}
                  </span>
                  <button
                    type="button"
                    onClick={onAddSuperficial}
                    disabled={isDefeated}
                    className="w-6 h-6 flex items-center justify-center bg-muted rounded hover:bg-blood hover:text-white transition-colors font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              /* Modo Completo V5: Superficial e Agravado */
              <div className="flex gap-2 justify-center relative">
                <DmgBlock
                  label="Superficial"
                  value={c.sup_dmg}
                  onAdd={onAddSuperficial}
                  onSub={onSubSuperficial}
                  addDisabled={isDefeated}
                />
                <DmgBlock
                  label="Agravado"
                  value={c.agr_dmg}
                  onAdd={onAddAggravated}
                  onSub={onSubAggravated}
                  isAgr
                  addDisabled={isDefeated}
                />
              </div>
            )}
          </div>

          {/* Trilha de Vontade (Modo Simplificado vs V5 Completo) */}
          <div
            className={`bg-surface-container-low p-2 rounded border transition-colors ${
              c.fw_sup + c.fw_agr >= c.max_wp
                ? "border-destructive/80 bg-red-950/20 shadow-[inset_0_0_10px_rgba(220,38,38,0.2)]"
                : "border-border/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Brain className="w-3 h-3 text-blue-400" /> Trilha de Vontade {isSimplifiedMode ? "(Rápida)" : "(V5)"}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateWp("max_wp", -1)}
                  className="text-muted-foreground hover:text-white"
                >
                  -
                </button>
                <span className="text-[10px] font-mono mx-1">Max: {c.max_wp}</span>
                <button
                  onClick={() => onUpdateWp("max_wp", 1)}
                  className="text-muted-foreground hover:text-white"
                >
                  +
                </button>
              </div>
            </div>

            {isSimplifiedMode ? (
              /* Modo Simplificado: Contador Único de Vontade Gasta / Dano */
              <div className="bg-background p-2 rounded border border-blue-500/30 flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 shrink-0">
                  Vontade Gasta
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateWp("fw_sup", -1)}
                    className="w-6 h-6 flex items-center justify-center bg-muted rounded hover:bg-destructive/30 hover:text-white transition-colors font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-extrabold text-sm whitespace-nowrap text-blue-400 min-w-[45px] text-center">
                    {c.fw_sup + c.fw_agr} / {c.max_wp}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateWp("fw_sup", 1)}
                    disabled={c.fw_sup + c.fw_agr >= c.max_wp}
                    className="w-6 h-6 flex items-center justify-center bg-muted rounded hover:bg-blue-600 hover:text-white transition-colors font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              /* Modo Completo V5: Superficial e Agravado */
              <div className="flex gap-2 justify-center relative">
                {c.fw_sup + c.fw_agr >= c.max_wp && (
                  <div className="absolute inset-0 bg-destructive/10 pointer-events-none rounded"></div>
                )}
                <DmgBlock
                  label="Superficial"
                  value={c.fw_sup}
                  onAdd={() => onUpdateWp("fw_sup", 1)}
                  onSub={() => onUpdateWp("fw_sup", -1)}
                />
                <DmgBlock
                  label="Agravado"
                  value={c.fw_agr}
                  onAdd={() => onUpdateWp("fw_agr", 1)}
                  onSub={() => onUpdateWp("fw_agr", -1)}
                  isAgr
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
