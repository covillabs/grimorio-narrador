import { useState, useEffect } from "react";
import { Dices, X, Flame, Skull, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  rollV5Pool,
  rollRouseCheck,
  rerollWithWillpower,
  RollResult,
  RouseCheckResult,
} from "@/utils/v5Dice";
import { toast } from "sonner";
import { getPrefixedKey } from "@/components/ChronicleSwitcher";

export function DiceRollerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pool" | "rouse">("pool");

  // Parâmetros do Pool
  const [pool, setPool] = useState<number>(5);
  const [hunger, setHunger] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<number | null>(2);
  const [poolResult, setPoolResult] = useState<RollResult | null>(null);

  // Seleção de dados normais para Re-roll de Força de Vontade
  const [selectedForReroll, setSelectedForReroll] = useState<string[]>([]);

  // Parâmetros do Rouse Check
  const [rouseHunger, setRouseHunger] = useState<number>(1);
  const [rouseResult, setRouseResult] = useState<RouseCheckResult | null>(null);
  const [coteriePlayers, setCoteriePlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // Carregar personagens da Coterie para sincronização opcional de Fome
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getPrefixedKey("v5_coterie"));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCoteriePlayers(parsed);
          setSelectedPlayerId(parsed[0]?.id || "");
          setRouseHunger(parsed[0]?.hunger ?? 1);
        }
      }
    } catch {}
  }, [isOpen]);

  const handlePlayerChange = (id: string) => {
    setSelectedPlayerId(id);
    const p = coteriePlayers.find((player) => player.id === id);
    if (p && Number.isFinite(p.hunger)) {
      setRouseHunger(p.hunger);
      setHunger(p.hunger);
    }
  };

  const executePoolRoll = () => {
    setSelectedForReroll([]);
    const res = rollV5Pool({
      pool,
      hunger,
      difficulty,
    });
    setPoolResult(res);

    if (res.outcome === "messy_critical") {
      toast.error("Crítico Bagunçado! A Besta contaminou o triunfo.", {
        icon: "🩸",
      });
    } else if (res.outcome === "bestial_failure") {
      toast.error("Falha Bestial! A Besta assume o controle do fracasso.", {
        icon: "💀",
      });
    } else if (res.outcome === "critical_success") {
      toast.success("Acerto Crítico! Triunfo com maestria suprema.", {
        icon: "✨",
      });
    }
  };

  const toggleDieSelection = (dieId: string) => {
    if (selectedForReroll.includes(dieId)) {
      setSelectedForReroll((prev) => prev.filter((id) => id !== dieId));
    } else {
      if (selectedForReroll.length >= 3) {
        toast.info("A regra oficial da V5 permite re-rolar no máximo 3 dados normais.");
        return;
      }
      setSelectedForReroll((prev) => [...prev, dieId]);
    }
  };

  const executeWillpowerReroll = () => {
    if (!poolResult) return;
    if (selectedForReroll.length === 0) {
      toast.info("Selecione até 3 dados normais que falharam para re-rolar.");
      return;
    }
    const updated = rerollWithWillpower(poolResult, selectedForReroll);
    setPoolResult(updated);
    setSelectedForReroll([]);
    toast.success("Força de Vontade gasta! Dados normais re-rolados.", {
      icon: "⚡",
    });
  };

  const executeRouseCheck = () => {
    const res = rollRouseCheck(rouseHunger);
    setRouseResult(res);

    if (res.hungerIncreased) {
      const newHunger = Math.min(5, rouseHunger + 1);
      setRouseHunger(newHunger);
      setHunger(newHunger);

      // Sincronizar na Coterie se houver jogador selecionado
      if (selectedPlayerId) {
        try {
          const key = getPrefixedKey("v5_coterie");
          const stored = localStorage.getItem(key);
          if (stored) {
            const list = JSON.parse(stored);
            const updated = list.map((p: any) =>
              p.id === selectedPlayerId ? { ...p, hunger: newHunger } : p
            );
            localStorage.setItem(key, JSON.stringify(updated));
            setCoteriePlayers(updated);
          }
        } catch {}
      }

      toast.error(res.title, { description: res.description });
    } else {
      toast.success(res.title, { description: res.description });
    }
  };

  const getOutcomeBadgeStyle = (outcome: string) => {
    switch (outcome) {
      case "critical_success":
        return "bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]";
      case "messy_critical":
        return "bg-red-950 text-blood-glow border-blood animate-pulse shadow-[0_0_15px_rgba(220,20,60,0.5)]";
      case "bestial_failure":
        return "bg-black text-rose-500 border-rose-600/60 shadow-[0_0_15px_rgba(225,29,72,0.4)]";
      case "success":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-84 sm:w-96 bg-zinc-950/95 backdrop-blur-md border border-blood/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.9)] overflow-hidden animate-in slide-in-from-bottom-5 duration-300 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-red-950/60 p-3.5 flex justify-between items-center border-b border-blood/40">
            <div className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-blood animate-pulse" />
              <h3 className="font-serif font-bold text-blood-glow text-sm tracking-wider uppercase">
                Mecânicas V5 • Motor de Sangue
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
              title="Fechar Rolador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Abas */}
          <div className="grid grid-cols-2 bg-zinc-900/80 border-b border-border/50 text-xs font-serif font-semibold">
            <button
              onClick={() => setActiveTab("pool")}
              className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "pool"
                  ? "bg-zinc-950 text-blood border-b-2 border-blood"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Dices className="w-3.5 h-3.5" /> Rolagem de Parada
            </button>
            <button
              onClick={() => setActiveTab("rouse")}
              className={`py-2 px-3 flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === "rouse"
                  ? "bg-zinc-950 text-blood border-b-2 border-blood"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Checagem de Despertar
            </button>
          </div>

          {/* Conteúdo da Aba 1: ROLAGEM DE PARADA */}
          {activeTab === "pool" && (
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Controles de Entrada */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Parada */}
                <div className="bg-zinc-900/60 p-2 rounded-lg border border-border/40">
                  <label className="text-[10px] uppercase text-zinc-400 font-bold block mb-1">
                    Parada (Pool)
                  </label>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setPool((p) => Math.max(1, p - 1))}
                      className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 font-mono font-bold text-base text-zinc-100">
                      {pool}
                    </span>
                    <button
                      onClick={() => setPool((p) => Math.min(20, p + 1))}
                      className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Fome */}
                <div className="bg-red-950/30 p-2 rounded-lg border border-blood/30">
                  <label className="text-[10px] uppercase text-blood font-bold block mb-1">
                    Fome (0-5)
                  </label>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setHunger((h) => Math.max(0, h - 1))}
                      className="w-6 h-6 rounded bg-red-900/60 hover:bg-red-800 text-red-200 font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 font-mono font-bold text-base text-blood">
                      {hunger}
                    </span>
                    <button
                      onClick={() => setHunger((h) => Math.min(5, h + 1))}
                      className="w-6 h-6 rounded bg-red-900/60 hover:bg-red-800 text-red-200 font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Dificuldade */}
                <div className="bg-zinc-900/60 p-2 rounded-lg border border-border/40">
                  <label className="text-[10px] uppercase text-zinc-400 font-bold block mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={difficulty === null ? "none" : difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value === "none" ? null : Number(e.target.value))
                    }
                    className="w-full bg-zinc-800 border border-border/60 text-xs rounded p-1 text-center font-bold text-zinc-200 focus:outline-none focus:border-blood"
                  >
                    <option value="none">Sem DC (Livre)</option>
                    <option value="1">DC 1 (Fácil)</option>
                    <option value="2">DC 2 (Médio)</option>
                    <option value="3">DC 3 (Desafiador)</option>
                    <option value="4">DC 4 (Difícil)</option>
                    <option value="5">DC 5 (Extremo)</option>
                    <option value="6">DC 6 (Lendário)</option>
                  </select>
                </div>
              </div>

              {/* Botão de Rolagem Principal */}
              <Button
                onClick={executePoolRoll}
                className="w-full bg-blood hover:bg-blood/85 text-white font-serif font-bold tracking-widest text-xs h-9 shadow-[0_0_15px_rgba(220,20,60,0.4)] transition-all active:scale-[0.98]"
              >
                INVOCAR O SANGUE (ROLAR D10)
              </Button>

              {/* Resultado Detalhado */}
              {poolResult && (
                <div className="pt-3 border-t border-border/50 space-y-3">
                  {/* Status Banner */}
                  <div
                    className={`p-2.5 rounded-lg border text-center transition-all ${getOutcomeBadgeStyle(
                      poolResult.outcome
                    )}`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-serif font-bold text-sm tracking-wide">
                        {poolResult.outcomeTitle}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 mt-1 leading-snug">
                      {poolResult.outcomeDescription}
                    </p>
                  </div>

                  {/* Placar de Sucessos */}
                  <div className="flex items-center justify-around bg-zinc-900/40 p-2 rounded-lg border border-border/30 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                        Sucessos
                      </span>
                      <span className="font-serif font-bold text-2xl text-zinc-100">
                        {poolResult.totalSuccesses}
                      </span>
                    </div>

                    {poolResult.criticalPairs > 0 && (
                      <div>
                        <span className="text-[10px] uppercase text-amber-400 font-bold block">
                          Pares de 10
                        </span>
                        <span className="font-serif font-bold text-xl text-amber-300">
                          {poolResult.criticalPairs} (={poolResult.criticalPairs * 4}★)
                        </span>
                      </div>
                    )}

                    {poolResult.difficulty !== null && (
                      <div>
                        <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                          Margem
                        </span>
                        <span
                          className={`font-mono font-bold text-lg ${
                            (poolResult.margin ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {(poolResult.margin ?? 0) >= 0
                            ? `+${poolResult.margin}`
                            : `${poolResult.margin}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Visualização Individual dos Dados */}
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 font-bold block mb-1.5">
                      Dados Sorteados:
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {/* Dados Normais */}
                      {poolResult.normalDice.map((die) => {
                        const isSelected = selectedForReroll.includes(die.id);
                        const canSelect =
                          poolResult.canRerollWithWillpower && die.value < 10;

                        return (
                          <button
                            key={die.id}
                            type="button"
                            disabled={!canSelect}
                            onClick={() => canSelect && toggleDieSelection(die.id)}
                            className={`w-8 h-8 rounded border flex flex-col items-center justify-center font-mono font-bold text-xs transition-all relative ${
                              die.isTen
                                ? "bg-amber-950/70 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                : die.isSuccess
                                ? "bg-zinc-800 border-emerald-500/60 text-emerald-300"
                                : "bg-zinc-900 border-zinc-700 text-zinc-400"
                            } ${
                              isSelected
                                ? "ring-2 ring-blue-400 scale-105 bg-blue-950/60"
                                : ""
                            } ${canSelect ? "cursor-pointer hover:border-blue-400" : ""}`}
                            title={
                              canSelect
                                ? "Clique para selecionar para re-roll de Força de Vontade"
                                : ""
                            }
                          >
                            <span>{die.value}</span>
                            {die.isTen && (
                              <span className="text-[8px] -mt-1 text-amber-400">★</span>
                            )}
                          </button>
                        );
                      })}

                      {/* Dados de Fome */}
                      {poolResult.hungerDice.map((die) => (
                        <div
                          key={die.id}
                          className={`w-8 h-8 rounded border flex flex-col items-center justify-center font-mono font-bold text-xs relative ${
                            die.isTen
                              ? "bg-red-900 border-blood text-white shadow-[0_0_12px_rgba(220,20,60,0.8)] animate-pulse"
                              : die.isOne
                              ? "bg-black border-red-600 text-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.6)]"
                              : die.isSuccess
                              ? "bg-red-950 border-red-500/70 text-red-200"
                              : "bg-red-950/60 border-red-900/60 text-red-400"
                          }`}
                          title={`Dado de Fome: ${die.value}`}
                        >
                          <span>{die.value}</span>
                          {die.isOne && (
                            <span className="text-[8px] -mt-1 text-rose-500">💀</span>
                          )}
                          {die.isTen && (
                            <span className="text-[8px] -mt-1 text-white">🩸</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Re-roll de Força de Vontade */}
                  {poolResult.canRerollWithWillpower && (
                    <div className="pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={executeWillpowerReroll}
                        disabled={selectedForReroll.length === 0}
                        className="w-full text-xs gap-1.5 border-blue-500/40 text-blue-300 hover:bg-blue-950/40 hover:text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-rolar com Vontade ({selectedForReroll.length}/3 Selecionados)
                      </Button>
                      <span className="text-[10px] text-zinc-500 block text-center mt-1">
                        Selecione até 3 dados normais acima (exceto 10s e Fome)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba 2: CHECAGEM DE DESPERTAR (ROUSE CHECK) */}
          {activeTab === "rouse" && (
            <div className="p-4 space-y-4">
              {/* Seleção de Personagem (Opcional) */}
              {coteriePlayers.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase text-zinc-400 font-bold block mb-1">
                    Vincular à Ficha da Coterie
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => handlePlayerChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-border/60 text-xs rounded p-1.5 text-zinc-200 font-serif"
                  >
                    {coteriePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.character_name} ({p.clan || "Sem Clã"}) • Fome {p.hunger ?? 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fome Atual */}
              <div className="bg-red-950/20 p-3 rounded-lg border border-blood/30 text-center">
                <span className="text-xs uppercase text-blood font-bold block mb-1">
                  Nível Atual de Fome
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setRouseHunger(lvl);
                        setHunger(lvl);
                      }}
                      className={`w-7 h-7 rounded-full font-mono text-xs font-bold transition-all ${
                        lvl <= rouseHunger
                          ? "bg-blood text-white shadow-[0_0_8px_rgba(220,20,60,0.7)] scale-105"
                          : "bg-zinc-900 border border-zinc-700 text-zinc-500 hover:border-zinc-500"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Disparo do Rouse Check */}
              <Button
                onClick={executeRouseCheck}
                className="w-full bg-gradient-to-r from-red-900 via-blood to-red-900 hover:brightness-110 text-white font-serif font-bold tracking-wider text-xs h-10 shadow-[0_0_20px_rgba(220,20,60,0.4)]"
              >
                <Flame className="w-4 h-4 mr-2 text-amber-400" />
                DESPERTAR O SANGUE (1D10)
              </Button>

              {/* Resultado do Rouse Check */}
              {rouseResult && (
                <div
                  className={`p-3.5 rounded-lg border text-center transition-all ${
                    rouseResult.success
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      : "bg-red-950/60 border-blood text-red-200 animate-in fade-in duration-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="font-mono font-bold text-3xl">
                      {rouseResult.die}
                    </span>
                    <div className="text-left">
                      <span className="font-serif font-bold text-sm block">
                        {rouseResult.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {rouseResult.die >= 6 ? "Resultado 6+ (Êxito)" : "Resultado 1-5 (Falha)"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-2 opacity-90 leading-relaxed">
                    {rouseResult.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botão Flutuante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full border-2 border-blood/60 bg-zinc-950 hover:bg-blood/20 shadow-[0_0_20px_rgba(153,27,27,0.5)] flex items-center justify-center relative group transition-all hover:scale-105 active:scale-95"
        title="Rolar Dados V5 (Parada & Rouse Check)"
      >
        <Dices className="w-6 h-6 text-blood group-hover:scale-110 transition-transform" />
      </Button>
    </div>
  );
}
