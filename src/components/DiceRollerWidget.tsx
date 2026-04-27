import { useState } from "react";
import { Dices, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DiceRollerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [pool, setPool] = useState<number>(5);
  const [hunger, setHunger] = useState<number>(1);
  const [result, setResult] = useState<any>(null);

  const rollV5 = () => {
    let normalDiceCount = Math.max(0, pool - hunger);
    let hungerDiceCount = Math.min(pool, hunger);

    let successes = 0;
    let normalTens = 0;
    let hungerTens = 0;
    let hungerOnes = 0;

    let normalRolls = [];
    for (let i = 0; i < normalDiceCount; i++) {
      let r = Math.floor(Math.random() * 10) + 1;
      normalRolls.push(r);
      if (r >= 6) successes++;
      if (r === 10) normalTens++;
    }

    let hungerRolls = [];
    for (let i = 0; i < hungerDiceCount; i++) {
      let r = Math.floor(Math.random() * 10) + 1;
      hungerRolls.push(r);
      if (r >= 6) successes++;
      if (r === 10) hungerTens++;
      if (r === 1) hungerOnes++;
    }

    // Calcular Críticos (Pares de 10)
    let totalTens = normalTens + hungerTens;
    let pairs = Math.floor(totalTens / 2);
    // Cada par contabiliza como 4 sucessos ao invés de 2. Como já somamos 2 no loop, adicionamos mais 2 por par.
    successes += pairs * 2;

    let isMessy = pairs > 0 && hungerTens > 0;
    let isBestial = successes === 0 && hungerOnes > 0;
    
    // Na V5 existe falha bestial mesmo se houver sucesso? Na edição clássica, falha bestial só ocorre se o teste FALHAR (ou seja, número de sucessos for menor que a Dificuldade). Mas como não estamos pedindo dificuldade no widget (para agilizar), consideramos que se tiver 1 no dado de fome, o mestre julga se a rolagem foi falha geral ou não. Mas avisamos da Presença do 1.

    let status = "Êxito Normal";
    let color = "text-green-400";
    if (isMessy) {
       status = "Crítico Bagunçado!";
       color = "text-red-500";
    } else if (isBestial) {
       status = "Falha Bestial!";
       color = "text-red-600 font-bold";
    } else if (successes === 0) {
       status = "Falha Total";
       color = "text-zinc-500";
    } else if (pairs > 0) {
       status = "Acerto Crítico!";
       color = "text-blue-400";
    }

    setResult({
       successes,
       totalTens,
       hungerOnes,
       status,
       color,
       normalRolls,
       hungerRolls
    });
  };

  return (
    <div className="fixed bottom-6 right-24 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-72 bg-zinc-950 border border-blood/40 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
           <div className="bg-blood/20 p-3 flex justify-between items-center border-b border-blood/30">
              <h3 className="font-serif font-bold text-blood-glow flex items-center text-sm">
                 <Dices className="w-4 h-4 mr-2" /> V5 Roller Engine
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </button>
           </div>
           
           <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs uppercase text-muted-foreground font-bold">Parada</label>
                    <input type="number" min="1" max="20" value={pool} onChange={e => setPool(Number(e.target.value))} className="w-full bg-zinc-900 border border-border rounded p-1 text-center font-bold mt-1" />
                 </div>
                 <div>
                    <label className="text-xs uppercase text-blood font-bold">Fome</label>
                    <input type="number" min="0" max="5" value={hunger} onChange={e => setHunger(Number(e.target.value))} className="w-full bg-zinc-900 border border-blood/50 text-blood rounded p-1 text-center font-bold mt-1" />
                 </div>
              </div>

              <Button onClick={rollV5} className="w-full bg-blood hover:bg-blood/80 text-white font-bold tracking-widest text-xs h-8">ROLA OS DADOS</Button>

              {result && (
                 <div className="mt-4 pt-4 border-t border-border/50 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Resultado Simulado</p>
                    <p className="text-4xl font-serif font-bold text-white mb-1">{result.successes}</p>
                    <p className={`text-sm tracking-widest uppercase font-bold ${result.color}`}>{result.status}</p>
                    
                    {(result.hungerOnes > 0 || (result.totalTens > 1 && result.status !== "Crítico Bagunçado!")) && (
                       <p className="text-[10px] text-muted-foreground mt-2 border border-border/50 bg-zinc-900 p-1 rounded">
                          (Dadas vermelhos c/ número 1: <strong className="text-red-500">{result.hungerOnes}</strong>)
                       </p>
                    )}
                 </div>
              )}
           </div>
        </div>
      )}
      
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-12 h-12 rounded-full border-2 border-blood/50 bg-zinc-950 hover:bg-blood/20 shadow-[0_0_20px_rgba(153,27,27,0.4)] flex items-center justify-center relative group"
        title="Rolar Dados V5"
      >
        <Dices className="w-6 h-6 text-blood group-hover:scale-110 transition-transform" />
      </Button>
    </div>
  );
}
