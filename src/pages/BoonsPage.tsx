import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Scale, Plus, X, Trash2, CheckCircle, User, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BOON_TYPES = {
  trivial: { label: "Trivial", color: "text-zinc-400", bg: "bg-zinc-400/10", border: "border-zinc-400/20" },
  minor: { label: "Menor", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  major: { label: "Maior", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  life: { label: "Vida", color: "text-blood", bg: "bg-blood/10", border: "border-blood/20" },
};

export default function BoonsPage() {
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  
  // Boons Dictionary
  const [boons, setBoons] = useCloudStorage<any[]>("v5_boons", []);

  // Form State
  const [form, setForm] = useState({
    type: "minor", from: "", to: "", description: ""
  });

  const handleCreateBoon = () => {
    if (!form.from || !form.to) {
      toast.error("Quem deve e quem recebe são obrigatórios!");
      return;
    }
    const newBoon = {
      ...form,
      id: "b_" + Date.now().toString(),
      isResolved: false
    };
    setBoons([newBoon, ...boons]);
    setIsCreatorOpen(false);
    toast.success("Favor registrado no Livro de Dívidas.");
    setForm({ type: "minor", from: "", to: "", description: "" });
  };

  const toggleResolve = (id: string) => {
    setBoons(boons.map(b => b.id === id ? { ...b, isResolved: !b.isResolved } : b));
    toast.info("Status do favor atualizado.");
  };

  const deleteBoon = (id: string) => {
    if (confirm("Apagar registro de dívida?")) {
      setBoons(boons.filter(b => b.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-blood-glow flex items-center gap-3">
            <Scale className="w-8 h-8 text-blood opacity-80" />
            Livro de Dívidas (Boons)
          </h1>
          <p className="text-muted-foreground mt-1">Economia de Favores e Débitos de Sangue</p>
        </div>
        <Button onClick={() => setIsCreatorOpen(true)} className="bg-blood text-white gap-2">
          <Plus className="w-4 h-4"/> Novo Favor
        </Button>
      </div>

      {/* Boon Creator Modal */}
      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-serif text-xl font-bold flex items-center gap-2"><Scale className="w-5 h-5 text-blood"/> Registrar Pacto</h2>
              <button onClick={() => setIsCreatorOpen(false)} className="text-muted-foreground hover:text-foreground"><X/></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Tipo de Favor</span>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger className="bg-background"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trivial">Favor Trivial</SelectItem>
                    <SelectItem value="minor">Favor Menor</SelectItem>
                    <SelectItem value="major">Favor Maior</SelectItem>
                    <SelectItem value="life">Débito de Vida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Quem Deve? (From)</span>
                  <Input value={form.from} onChange={e => setForm({...form, from: e.target.value})} placeholder="NPC ou Jogador"/>
                </div>
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Para Quem? (To)</span>
                  <Input value={form.to} onChange={e => setForm({...form, to: e.target.value})} placeholder="NPC ou Jogador"/>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Motivo/Acordo</span>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="O que foi prometido?" className="h-24"/>
              </div>

              <Button onClick={handleCreateBoon} className="w-full bg-blood text-white">Selas Pacto</Button>
            </div>
          </div>
        </div>
      )}

      {/* Boons List (The Ledger Look) */}
      <div className="flex-1 overflow-y-auto space-y-8 pb-10 pr-2">
        
        {/* Ativos */}
        <section>
          <div className="flex items-center gap-2 mb-4 border-b border-blood/20 pb-2">
            <h2 className="font-serif font-black uppercase text-sm tracking-widest text-blood-glow">Dívidas Ativas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boons.filter(b => !b.isResolved).map(boon => {
              const style = (BOON_TYPES as any)[boon.type];
              return (
                <div key={boon.id} className={`bg-card border ${style.border} p-4 rounded-lg relative group hover:bg-muted/30 transition-colors`}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`${style.color} ${style.bg} ${style.border} uppercase text-[10px] px-2`}>
                      Favor {style.label}
                    </Badge>
                    <div className="flex gap-2">
                      <button onClick={() => toggleResolve(boon.id)} className="p-1.5 rounded-full hover:bg-green-500/10 text-muted-foreground hover:text-green-500 transition-colors" title="Marcar como Pago">
                        <CheckCircle className="w-4 h-4"/>
                      </button>
                      <button onClick={() => deleteBoon(boon.id)} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 font-serif font-bold text-foreground">
                    <div className="flex flex-col items-center">
                       <User className="w-4 h-4 text-muted-foreground" />
                       <span className="text-xs mt-1">{boon.from}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blood/50" />
                    <div className="flex flex-col items-center">
                       <ShieldCheck className="w-4 h-4 text-primary" />
                       <span className="text-xs mt-1">{boon.to}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-foreground/80 leading-relaxed italic border-l border-blood/30 pl-3">
                    {boon.description}
                  </p>
                </div>
              );
            })}
          </div>
          {boons.filter(b => !b.isResolved).length === 0 && <p className="text-center text-muted-foreground py-10 italic">Nenhum débito pendente na cidade.</p>}
        </section>

        {/* Resolvidos */}
        <section className="opacity-60 grayscale-[0.5]">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-2 text-muted-foreground">
            <h2 className="font-serif font-black uppercase text-sm tracking-widest">Histórico de Favores Pagos</h2>
          </div>
          <div className="space-y-2">
            {boons.filter(b => b.isResolved).map(boon => {
               const style = (BOON_TYPES as any)[boon.type];
               return (
                 <div key={boon.id} className="bg-surface-container-low border border-border/50 p-3 rounded flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                       <Badge variant="outline" className="text-[8px] uppercase">{style.label}</Badge>
                       <span className="text-xs font-bold truncate">{boon.from} ➔ {boon.to}</span>
                       <span className="text-xs text-muted-foreground line-through truncate">{boon.description}</span>
                    </div>
                    <button onClick={() => toggleResolve(boon.id)} className="text-[10px] uppercase font-bold text-blood hover:underline shrink-0">Reabrir</button>
                 </div>
               );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
