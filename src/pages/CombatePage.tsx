import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Sword, Plus, Trash2, Heart, Skull, ShieldBan, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Combatant = {
  id: string;
  name: string;
  type: "player" | "npc" | "custom";
  max_hp: number;
  max_wp: number;
  sup_dmg: number;
  agr_dmg: number;
  fw_sup: number;
  fw_agr: number;
};

export default function CombatePage() {
  const [combatants, setCombatants] = useCloudStorage<Combatant[]>("v5_arena", []);

  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [availableNpcs, setAvailableNpcs] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");

  useEffect(() => {
    const p = localStorage.getItem("v5_coterie");
    if (p) setAvailablePlayers(JSON.parse(p));
    const n = localStorage.getItem("v5_npcs");
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
        max_hp: 6, max_wp: 5,
        sup_dmg: 0, agr_dmg: 0, fw_sup: 0, fw_agr: 0
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

  const clearArena = () => {
    setCombatants([]);
    toast("A poeira baixou...", { description: "Arena de Sangue foi limpa." });
  };

  const updateDmg = (id: string, field: keyof Combatant, delta: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === id) {
        let val = (c[field] as number) + delta;
        if (val < 0) val = 0;
        return { ...c, [field]: val };
      }
      return c;
    }));
  };

  // Render a tiny damage box
  const DmgBlock = ({ label, value, onAdd, onSub, isAgr }: { label: string, value: number, onAdd: () => void, onSub: () => void, isAgr?: boolean }) => (
    <div className="flex flex-col items-center bg-background p-1.5 rounded border border-border/50">
       <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
       <div className="flex items-center gap-2">
         <button onClick={onSub} className="w-5 h-5 flex items-center justify-center bg-muted rounded hover:bg-destructive/30 hover:text-white transition-colors">-</button>
         <span className={`font-mono font-bold w-4 text-center ${isAgr ? 'text-red-500' : 'text-blue-400'}`}>{value}</span>
         <button onClick={onAdd} className="w-5 h-5 flex items-center justify-center bg-muted rounded hover:bg-blood hover:text-white transition-colors">+</button>
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
            <p className="text-muted-foreground mt-1 text-sm">Painel Tático de Conflito em Turnos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={clearArena} className="border-destructive text-destructive hover:bg-destructive hover:text-white h-9 text-xs">
             Encerrar Combate
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {combatants.map(c => (
              <div key={c.id} className={`bg-card p-4 rounded-lg border-2 ${c.type === 'player' ? 'border-blue-900/40 shadow-[0_0_15px_rgba(30,58,138,0.1)]' : 'border-red-900/40 shadow-[0_0_15px_rgba(153,27,27,0.1)]'} relative group transition-all`}>
                 <button onClick={() => removeCombatant(c.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                 </button>
                 
                 <div className="flex items-center gap-2 mb-4 pr-6">
                    <Badge variant="outline" className={`text-[10px] uppercase ${c.type === 'player' ? 'text-blue-400 border-blue-900' : 'text-red-400 border-red-900'}`}>{c.type}</Badge>
                    <h3 className="font-serif font-bold text-lg truncate">{c.name}</h3>
                    {(c.sup_dmg + c.agr_dmg >= c.max_hp || c.fw_sup + c.fw_agr >= c.max_wp) && (
                       <Badge variant="destructive" className="ml-auto text-[10px] animate-pulse">
                          -2 DADOS (Impair)
                       </Badge>
                    )}
                 </div>

                 <div className="space-y-4">
                    {/* Saúde */}
                    <div className={`bg-surface-container-low p-2 rounded border transition-colors ${c.sup_dmg + c.agr_dmg >= c.max_hp ? 'border-destructive/80 bg-red-950/20 shadow-[inset_0_0_10px_rgba(220,38,38,0.2)]' : 'border-border/50'}`}>
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                             <Heart className="w-3 h-3" /> Trilha de Vitalidade
                          </h4>
                          <div className="flex items-center gap-1">
                             <button onClick={() => updateDmg(c.id, 'max_hp', -1)} className="text-muted-foreground hover:text-white">-</button>
                             <span className="text-[10px] font-mono mx-1">Max: {c.max_hp}</span>
                             <button onClick={() => updateDmg(c.id, 'max_hp', 1)} className="text-muted-foreground hover:text-white">+</button>
                          </div>
                       </div>
                       <div className="flex gap-2 justify-center relative">
                          {c.sup_dmg + c.agr_dmg >= c.max_hp && <div className="absolute inset-0 bg-destructive/10 pointer-events-none rounded"></div>}
                          <DmgBlock label="Superficial" value={c.sup_dmg} onAdd={() => updateDmg(c.id, 'sup_dmg', 1)} onSub={() => updateDmg(c.id, 'sup_dmg', -1)} />
                          <DmgBlock label="Agravado" value={c.agr_dmg} onAdd={() => updateDmg(c.id, 'agr_dmg', 1)} onSub={() => updateDmg(c.id, 'agr_dmg', -1)} isAgr />
                       </div>
                    </div>

                    {/* Vontade */}
                    <div className={`bg-surface-container-low p-2 rounded border transition-colors ${c.fw_sup + c.fw_agr >= c.max_wp ? 'border-destructive/80 bg-red-950/20 shadow-[inset_0_0_10px_rgba(220,38,38,0.2)]' : 'border-border/50'}`}>
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <Brain className="w-3 h-3" /> Trilha de Vontade
                         </h4>
                         <div className="flex items-center gap-1">
                             <button onClick={() => updateDmg(c.id, 'max_wp', -1)} className="text-muted-foreground hover:text-white">-</button>
                             <span className="text-[10px] font-mono mx-1">Max: {c.max_wp}</span>
                             <button onClick={() => updateDmg(c.id, 'max_wp', 1)} className="text-muted-foreground hover:text-white">+</button>
                          </div>
                       </div>
                       <div className="flex gap-2 justify-center relative">
                          {c.fw_sup + c.fw_agr >= c.max_wp && <div className="absolute inset-0 bg-destructive/10 pointer-events-none rounded"></div>}
                          <DmgBlock label="Superficial" value={c.fw_sup} onAdd={() => updateDmg(c.id, 'fw_sup', 1)} onSub={() => updateDmg(c.id, 'fw_sup', -1)} />
                          <DmgBlock label="Agravado" value={c.fw_agr} onAdd={() => updateDmg(c.id, 'fw_agr', 1)} onSub={() => updateDmg(c.id, 'fw_agr', -1)} isAgr />
                       </div>
                    </div>
                 </div>

              </div>
           ))}
        </div>
      )}
    </div>
  );
}

// Quick helper icon not imported at top
function Brain(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/></svg>
  )
}
