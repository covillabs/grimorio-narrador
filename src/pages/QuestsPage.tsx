import { useState, useEffect } from "react";
import { Search, Crown, Sparkles, CheckSquare, Square, Target, AlertTriangle, ArrowRight, Plus, X, User, Filter, Calendar, Bookmark, BookmarkCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QUEST_TYPES = [
  { id: "all", label: "Todos tipos" },
  { id: "politica", label: "Política", icon: Crown, color: "text-yellow-600", bg: "bg-yellow-600/10" },
  { id: "investigacao", label: "Investigação", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "ocultismo", label: "Ocultismo", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export default function QuestsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [playerFilter, setPlayerFilter] = useState("");
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // External Data
  const [sessions, setSessions] = useState<any[]>([]);
  
  // Pistas Status Master Dictionary
  const [clues, setClues] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("v5_clues");
    return saved ? JSON.parse(saved) : {};
  });

  // Quests Dictionary
  const [quests, setQuests] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_quests");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedSessions = localStorage.getItem("v5_sessions");
    if (savedSessions) setSessions(JSON.parse(savedSessions));
  }, []);

  useEffect(() => {
    localStorage.setItem("v5_quests", JSON.stringify(quests));
    localStorage.setItem("v5_clues", JSON.stringify(clues));
  }, [quests, clues]);

  // Form State
  const [form, setForm] = useState({
    title: "", 
    type: "investigacao", 
    status: "Em Andamento", 
    client: "", 
    assignedTo: "", 
    description: "", 
    loot: "", 
    fallout: "",
    category: "side", // main | side
    sessionId: "hidden", // Link para sessão
    cluesData: [{ id: Date.now().toString(), text: "", assignedTo: "" }],
    routes: [{ name: "", req: "", desc: "" }]
  });

  const toggleClue = (clueId: string) => {
    setClues(prev => ({ ...prev, [clueId]: !prev[clueId] }));
  };

  const handleCreateQuest = () => {
    if (!form.title || !form.assignedTo) {
      toast.error("O Título e os 'Jogadores' são obrigatórios!");
      return;
    }
    const newQuest = {
      ...form,
      id: "q_" + Date.now().toString(),
      cluesData: form.cluesData.filter(c => c.text.trim() !== ""),
      routes: form.routes.filter(r => r.name.trim() !== "")
    };
    
    setQuests([newQuest, ...quests]);
    setIsCreatorOpen(false);
    toast.success("Trama registrada no Grimório!");
    setForm({
      title: "", type: "investigacao", status: "Em Andamento", client: "", assignedTo: "", description: "", loot: "", fallout: "",
      category: "side", sessionId: "hidden",
      cluesData: [{ id: Date.now().toString(), text: "", assignedTo: "" }],
      routes: [{ name: "", req: "", desc: "" }]
    });
  };

  const deleteQuest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Deseja apagar esta trama definitivamente?")) {
      setQuests(quests.filter(q => q.id !== id));
    }
  };

  const allPlayers = Array.from(new Set(
    quests.flatMap(q => {
      const qPlayers = q.assignedTo?.split(",").map((s: string) => s.trim()) || [];
      const puzzlePlayers = q.cluesData?.map((c: any) => c.assignedTo?.trim()).filter(Boolean) || [];
      return [...qPlayers, ...puzzlePlayers];
    })
  )).filter(Boolean) as string[];

  const applyFilters = (list: any[]) => {
    return list.filter(q => {
      const matchesTab = activeFilter === "all" || q.type === activeFilter;
      if (!matchesTab) return false;
      
      if (playerFilter && playerFilter !== "all-players") {
        const qPlayers = q.assignedTo?.split(",").map((s: string) => s.trim().toLowerCase()) || [];
        const puzzlePlayers = q.cluesData?.map((c: any) => c.assignedTo?.trim().toLowerCase()).filter(Boolean) || [];
        const filterLower = playerFilter.toLowerCase();
        return qPlayers.includes(filterLower) || puzzlePlayers.includes(filterLower);
      }
      return true;
    });
  };

  const mainQuests = applyFilters(quests.filter(q => q.category === "main"));
  const sideQuests = applyFilters(quests.filter(q => q.category !== "main"));

  const getTypeStyle = (typeId: string) => QUEST_TYPES.find(t => t.id === typeId) || QUEST_TYPES[0];

  const getSessionTitle = (sid: string) => {
    const s = sessions.find(s => s.id === sid);
    return s ? s.title : "Sessão Desconhecida";
  };

  const QuestCard = ({ quest }: { quest: any }) => {
    const typeStyle = getTypeStyle(quest.type);
    const TypeIcon = typeStyle.icon || Target;
    const isExpanded = expandedQuest === quest.id;
    const players = quest.assignedTo?.split(",").map((s: string) => s.trim()).filter(Boolean) || [];

    return (
      <div className={`bg-card border transition-all rounded-lg overflow-hidden group ${isExpanded ? 'border-primary shadow-[0_0_20px_rgba(139,0,0,0.15)]' : 'border-border hover:border-primary/50'}`}>
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer relative" onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}>
          <div className="absolute top-0 right-0 flex gap-1 items-start">
             {players.map((p: string, idx: number) => (
               <div key={idx} className="bg-surface-container-high border-b border-l border-primary/30 px-3 py-1 flex items-center gap-2 rounded-bl-lg first:rounded-bl-none">
                  <User className="w-3 h-3 text-primary" />
                  <span className="text-[10px] uppercase font-bold text-foreground">{p}</span>
               </div>
             ))}
          </div>

          <div className="flex items-start gap-4 mt-6 md:mt-0">
            <div className={`p-3 rounded-lg ${typeStyle.bg} border border-border mt-1 shrink-0`}>
              <TypeIcon className={`w-6 h-6 ${typeStyle.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{typeStyle.label}</span>
                <Badge variant={quest.category === "main" ? "default" : "outline"} className="text-[9px] uppercase tracking-widest">
                  {quest.category === "main" ? "Arco Principal" : "Secundária"}
                </Badge>
                {quest.sessionId && quest.sessionId !== "hidden" && (
                  <Badge variant="secondary" className="text-[9px] uppercase tracking-widest gap-1">
                    <Calendar className="w-2.5 h-2.5"/> {getSessionTitle(quest.sessionId)}
                  </Badge>
                )}
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors">{quest.title}</h3>
              <p className="text-sm text-foreground/70 mt-1">Quest Giver: <span className="text-blood font-semibold">{quest.client || "-"}</span></p>
            </div>
          </div>
          
          <div className="hidden md:flex gap-4 items-center">
            <button onClick={(e) => deleteQuest(quest.id, e)} className="text-xs text-muted-foreground hover:text-destructive uppercase tracking-widest">Apagar</button>
            <div className="opacity-50 font-serif text-2xl group-hover:text-primary group-hover:opacity-100 transition-all">{isExpanded ? '−' : '+'}</div>
          </div>
        </div>

        {isExpanded && (
          <div className="p-5 pt-0 bg-surface-container-low border-t border-border flex flex-col space-y-6 animate-in slide-in-from-top-2">
            <p className="text-sm italic text-muted-foreground mt-4 leading-relaxed border-l-2 border-blood pl-3">{quest.description}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h4 className="font-bold font-serif text-sm uppercase tracking-widest flex items-center gap-2"><Search className="w-4 h-4 text-blue-500" /> Puzzles e Pistas</h4>
                <div className="bg-background border border-border rounded-md p-3 space-y-2">
                  {quest.cluesData?.map((clue: any) => (
                    <div key={clue.id} onClick={(e) => { e.stopPropagation(); toggleClue(clue.id); }} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors border-l-2 border-transparent hover:border-blood">
                      <div className="flex items-start gap-3">
                        {clues[clue.id] ? <CheckSquare className="w-5 h-5 text-blood shrink-0 mt-0.5" /> : <Square className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                        <span className={`text-sm ${clues[clue.id] ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>{clue.text}</span>
                      </div>
                      {clue.assignedTo && <Badge variant="secondary" className="text-[9px] uppercase h-5 bg-primary/20 text-primary">{clue.assignedTo}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold font-serif text-sm uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-green-500" /> Rotas de Resolução</h4>
                <div className="space-y-2">
                  {quest.routes?.map((route: any, i: number) => (
                    <div key={i} className="bg-background border border-border p-3 rounded-md flex flex-col">
                      <span className="font-bold text-primary flex items-center gap-2 mb-1"><ArrowRight className="w-3 h-3"/> {route.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{route.req}</span>
                      <span className="text-xs text-foreground/80 mt-1">{route.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div className="bg-green-950/20 border-l-4 border-green-700/50 p-4 rounded-r">
                 <h5 className="text-[10px] uppercase font-bold tracking-widest text-green-500/80 mb-2">Recompensa (Loot)</h5>
                 <p className="text-sm font-semibold">{quest.loot}</p>
              </div>
              <div className="bg-destructive/10 border-l-4 border-destructive/50 p-4 rounded-r">
                 <h5 className="text-[10px] uppercase font-bold tracking-widest text-destructive/80 mb-2 flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Falha Crítica / Fallout</h5>
                 <p className="text-sm font-semibold">{quest.fallout}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-serif font-bold text-blood-glow flex items-center gap-3">
            <Target className="w-8 h-8 text-blood opacity-80" />
            Tramas e Contratos
          </h1>
          <p className="text-muted-foreground mt-1">Gerenciador inteligente de Arcos Narrativos e Puzzles</p>
        </div>
        <Button onClick={() => setIsCreatorOpen(true)} className="bg-primary text-white gap-2">
          <Plus className="w-4 h-4"/> Novo Contrato
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center border-b border-border/50 pb-4">
        <div className="flex flex-wrap gap-2">
          {QUEST_TYPES.map(filter => {
            const Icon = filter.icon || Target;
            return (
              <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-xs tracking-widest uppercase transition-all ${activeFilter === filter.id ? "bg-surface-container-high border-b-2 border-primary text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}>
                {filter.icon && <Icon className="w-4 h-4 opacity-80" />}
                {filter.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 ml-auto bg-surface-container-low px-3 py-1 rounded border border-border/50">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={playerFilter} onValueChange={setPlayerFilter}>
            <SelectTrigger className="w-[180px] h-7 bg-background text-xs"><SelectValue placeholder="Jogador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-players">Todos</SelectItem>
              {allPlayers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isCreatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mt-10">
            <div className="sticky top-0 bg-background/95 border-b border-border p-5 flex justify-between items-center z-10">
              <h2 className="font-serif text-2xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-blood"/> Registrar Nova Trama</h2>
              <button onClick={() => setIsCreatorOpen(false)} className="text-muted-foreground hover:text-foreground"><X/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Título da Quest</span>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: O Sumiço no Porto"/>
                </div>
                <div className="space-y-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground block">Categoria e Sessão</span>
                  <div className="flex gap-2">
                    <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                      <SelectTrigger className="bg-background flex-1 h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Arc</SelectItem>
                        <SelectItem value="side">Side Quest</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={form.sessionId} onValueChange={v => setForm({...form, sessionId: v})}>
                      <SelectTrigger className="bg-background flex-1 h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hidden">Sem Sessão</SelectItem>
                        {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Tipo e Giver</span>
                  <div className="flex gap-2">
                    <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                      <SelectTrigger className="bg-background flex-1 h-9"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investigacao">Investigação</SelectItem>
                        <SelectItem value="politica">Política</SelectItem>
                        <SelectItem value="ocultismo">Ocultismo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={form.client} onChange={e => setForm({...form, client: e.target.value})} placeholder="Quest Giver" className="flex-1 h-9"/>
                  </div>
                </div>
                <div className="space-y-2 border-l-2 border-primary pl-4">
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">Jogadores</span>
                  <Input value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} placeholder="Lucien, Rafael..."/>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Contexto Narrativo</span>
                <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descreva o que está acontecendo..."/>
              </div>
              <div className="border border-border p-4 rounded bg-surface-container-low space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold flex items-center gap-2 text-sm"><Search className="w-4 h-4 text-blue-500"/> Puzzles / Etapas</h4>
                  <Button variant="ghost" size="sm" onClick={() => setForm({...form, cluesData: [...form.cluesData, {id: Date.now().toString(), text: "", assignedTo: ""}]})}><Plus className="w-4 h-4"/></Button>
                </div>
                {form.cluesData.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={c.text} onChange={e => { const nC = [...form.cluesData]; nC[i].text = e.target.value; setForm({...form, cluesData: nC}); }} placeholder="Descrição..." className="flex-[2] h-8 text-xs bg-background"/>
                    <Input value={c.assignedTo} onChange={e => { const nC = [...form.cluesData]; nC[i].assignedTo = e.target.value; setForm({...form, cluesData: nC}); }} placeholder="Responsável" className="flex-1 h-8 text-[10px] bg-background"/>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border">
                <Button variant="ghost" className="w-full" onClick={() => setIsCreatorOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateQuest} className="bg-blood text-white w-full">Salvar Trama</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO POR CATEGORIA */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-10">
        
        {/* ARCO PRINCIPAL */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <BookmarkCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-black uppercase tracking-widest text-foreground">Metatrama (Arco Principal)</h2>
          </div>
          <div className="space-y-4">
            {mainQuests.map(q => <QuestCard key={q.id} quest={q} />)}
            {mainQuests.length === 0 && <p className="text-xs text-muted-foreground italic px-4">Nenhuma trama principal ativa.</p>}
          </div>
        </section>

        {/* SIDE QUESTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Bookmark className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-serif font-black uppercase tracking-widest text-muted-foreground">Tramas Secundárias (Side Quests)</h2>
          </div>
          <div className="space-y-4">
            {sideQuests.map(q => <QuestCard key={q.id} quest={q} />)}
            {sideQuests.length === 0 && <p className="text-xs text-muted-foreground italic px-4">Nenhuma missão secundária ativa.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}
