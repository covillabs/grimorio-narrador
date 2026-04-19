import { useState, useEffect } from "react";
import { BookOpen, Droplets, Skull, FlaskConical, Flame, ShieldAlert, Cross, Sparkles, Plus, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TABS = [
  { id: "rituals", label: "Feitiçaria de Sangue", icon: Droplets },
  { id: "oblivion", label: "Cerimônias de Oblívio", icon: Skull },
  { id: "alchemy", label: "Alquimia Sangue-Fino", icon: FlaskConical },
  { id: "dangers", label: "Perigos do Ocultismo", icon: Flame },
];

const V5_CORE_RITUALS = [
  // Nível 1
  { level: 1, name: "Elo de Sangue (Blood Bond)", desc: "Estabiliza a vitae num frasco mantendo a propriedade do Elo. Não requer rolagem. Leva 1 hora." },
  { level: 1, name: "Certificação de Sangue", desc: "Rolagem: Inteligência + Feitiçaria. Revela se dois sangues são do mesmo Vítima/Senhor/Progênie." },
  { level: 1, name: "Rastreador (Taste of Blood)", desc: "Rolagem: Int + Feitiçaria. Sente geração, último alvo e as emoções passadas no sangue." },
  { level: 1, name: "Despertar o Aço (Wake with Evening's Freshness)", desc: "Rolagem automática ao dormir. Acorda o feitiçeiro instintivamente sob qualquer perigo diurno." },
  
  // Nível 2
  { level: 2, name: "Comunicação com o Senhor", desc: "Cria um link telepático temporário apenas com seu Senhor direto, importa a distância." },
  { level: 2, name: "Olhos de Babel", desc: "Permite ler e falar e entender a língua nativa de um indivíduo cujo sangue foi consumido." },
  { level: 2, name: "Trilha da Presa", desc: "Faz pegadas, rastros e calor recente de um alvo brilharem em tons escarlates perceptíveis só pelo mago." },
  { level: 2, name: "Verdade do Sangue", desc: "Int + Feitiçaria vs Autocontrole + Perseverança. O alvo é forçado a contar a verdade absoluta tendo seu sangue com o mago." },
  { level: 2, name: "Proteção contra Carniçais", desc: "Dif base 4. Símbolo (Sigil) que causa dano em mortais/carniçais que o tocarem." },

  // Nível 3
  { level: 3, name: "A Carícia de Dagon", desc: "Pode esmagar o sangue no corpo de um alvo remotamente (Causa Dano Superficial que não pode ser curado até a próxima noite)." },
  { level: 3, name: "Desvio da Perdição de Madeira", desc: "Estacas direcionadas ao seu coração quebram automaticamente antes de perfurar o esterno." },
  { level: 3, name: "Andarilho do Fogo (Firewalker)", desc: "Concede Imunidade extra e bônus na absorção de Dano por Fogo." },
  { level: 3, name: "Proteção contra Lupinos", desc: "Funciona como a de Nível 2, mas focada e mortal contra Lobisomens/Feras." },

  // Nível 4
  { level: 4, name: "Passagem Incorpórea", desc: "O Vínculo sombrio afina o próprio corpo. Torna-se intangível igual a projeção astral, mas no plano físico." },
  { level: 4, name: "Proteção contra Membros", desc: "Versão definitiva do selo. Repele Cainitas causando dano agravado puro." },

  // Nível 5
  { level: 5, name: "Coração de Pedra", desc: "Transforma o próprio coração em granito. O Feiticeiro fica absurdamente letárgico (-2 Presença, Sem emoções sentimentais) mas 100% imune a estacas." },
  { level: 5, name: "Fuga para o Santuário", desc: "Desenha círculos e exige 2 rouses. Teletransporta o mago no mesmo segundo para seu Haven caso acabe encurralado." },
  { level: 5, name: "Semente da Corrupção", desc: "Implantação mágica. Torna impossível que uma pessoa perca um Elo de Sangue ou recupere a mente sem mágica de Nível Alto." },
];

const V5_CORE_OBLIVION = [
  { level: 1, name: "O Grilhão Sombrio (The Binding Fetter)", desc: "Revela se o objeto segurado é um Grilhão de um Espectro. Sem rolagem." },
  { level: 1, name: "Comunhão com Gritos (Summon Spirit)", desc: "Rolagem: Resolução + Oblívio vs Perseverança do fantasma. Sucessos permitem invocar/fazer perguntas ao fantasma da área." },
  { level: 2, name: "Persuadir Espírito (Compel Spirit)", desc: "Rolagem: Resolução + Oblívio vs Perseverança. Obriga uma Aparição invocada a realizar uma tarefa mundana simples pelo necromante." },
  { level: 3, name: "Hordas Cambaleantes (Shambling Hordes)", desc: "Rolagem: Inteligência + Oblívio. Reanima cadáveres como zumbis protetores leais até apodrecerem completamente." },
  { level: 3, name: "Vasilhame Espiritual (Host Spirit)", desc: "Permite ao executor possuir um cadáver ou objeto com o espírito de um fantasma subjugado." },
  { level: 4, name: "Costurar o Véu (Split the Shroud)", desc: "Rasga o tecido da realidade, permitindo que o vampiro espie ou entre nas Terras das Sombras (Underworld)." },
  { level: 5, name: "Avatar Sombrio (Ex Nihilo)", desc: "Mergulho completo na dimensão morta. Imuniza contra luz do sol se escondido nas muralhas de ossos e transcende danos físicos básicos." }
];

const V5_CORE_ALCHEMY = [
  { level: 1, name: "Névoa Constrita (Haze - Obfuscação)", desc: "Destila um vapor frio que concede Obfuscação 1 (Manto das Sombras). Requer sangue Melancólico." },
  { level: 1, name: "Foco Telecinético (Far Reach)", desc: "Replica Aceleração/Atração de objetos pequenos. Requer sangue Colérico destilado." },
  { level: 2, name: "Proficiência Nebulosa", desc: "Destila e embute Rapidez 2 (Celeridade) no sistema do Alquimista. Ferve com Ressonância Sanguínea." },
  { level: 3, name: "Desvio do Destino de Madeira", desc: "Reação a estacas semelhante à Feitiçaria, porém através da mutação do ventrículo. Sangue Fleumático exigido." },
  { level: 4, name: "Voo Efêmero (Airborne Momentum)", desc: "Bebida instável que altera a densidade espinhal. Concede ao Sangue-fino a habilidade real de flutuar e dar saltos monstruosos no ar." },
  { level: 5, name: "O Despertar do Sangue (Awaken the Blood)", desc: "O auge obscuro. O sangue-fino metaboliza temporariamente Vitae verdadeira de Alta Geração, curando como um Ancião e burlando as restrições de Sangue Fino." }
];

export default function OcultismoPage() {
  const [activeTab, setActiveTab] = useState("rituals");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newEntry, setNewEntry] = useState<any>({
    type: "rituals",
    name: "",
    level: 1,
    rouse_cost: 1,
    time: "",
    ingredients: "",
    system: "",
    extra: "" // Usado para 'stains' no Oblivio ou 'distillation' e 'resonance' na Alquimia
  });

  const [rituals, setRituals] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_rituals");
    if (saved) return JSON.parse(saved);
    return [
    {
      name: "Proteção de Sangue (Ward)",
      level: 3,
      rouse_cost: 1,
      time: "1 hora",
      ingredients: "Um punhado de cinzas de um cadáver queimado, misturado com a Vitae do conjurador.",
      system: "Rolagem: Inteligência + Feitiçaria de Sangue (Dificuldade 4). Qualquer criatura sobrenatural tocando o objeto sofre uma penalidade de dados e pode queimar em dano Agravado.",
    },
    {
      name: "Guardião de Sangue",
      level: 4,
      rouse_cost: 2,
      time: "Uma noite inteira",
      ingredients: "Restos de uma estátua profanada, banhada em 2 Rouse Checks de Vitae.",
      system: "Rolagem: Inteligência + Feitiçaria de Sangue (Dificuldade 5). Cria um homúnculo animado que defende o Haven. Tem 10 de Vitalidade e ignora dano de balas.",
    }
    ];
  });

  const [oblivion, setOblivion] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_oblivion");
    if (saved) return JSON.parse(saved);
    return [
      {
        name: "O Chamado das Sombras",
        level: 2,
        rouse_cost: 1,
        stains: "Sim (Em resultado 1 ou 10 em dados de Fome)",
        time: "10 minutos",
        ingredients: "Sangue humano resfriado e cera de velório.",
        system: "Rolagem: Inteligência + Oblívio (Dificuldade 3). Invoca uma sombra tangível que pode apagar fontes de luz ou atacar sorrateiramente.",
        danger: "Críticos Bagunçados causam Máculas diretas na Trilha de Humanidade."
      }
    ];
  });

  const [alchemy, setAlchemy] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_alchemy");
    if (saved) return JSON.parse(saved);
    return [
      {
        name: "Proficiência Nebulosa",
        level: 2,
        distillation: "Calcinatio (No próprio sangue do criador)",
        resonance: "Sanguínea (Desejo/Exaltação)",
        system: "Rolagem: Vigor + Alquimia (Dificuldade 3). Concede Rapidez 1 ao alquimista. A validade do sangue estabilizado no sistema é de uma noite.",
      }
    ];
  });

  useEffect(() => { localStorage.setItem("v5_rituals", JSON.stringify(rituals)); }, [rituals]);
  useEffect(() => { localStorage.setItem("v5_oblivion", JSON.stringify(oblivion)); }, [oblivion]);
  useEffect(() => { localStorage.setItem("v5_alchemy", JSON.stringify(alchemy)); }, [alchemy]);

  const handleSave = () => {
    if(!newEntry.name) { toast.error("O feitiço carece de um nome."); return; }
    
    if(newEntry.type === "rituals") {
      setRituals([...rituals, { ...newEntry, id: Date.now() }]);
    } else if(newEntry.type === "oblivion") {
      setOblivion([...oblivion, { ...newEntry, stains: newEntry.extra || "Não", danger: "Maldição Padrão", id: Date.now() }]);
    } else if(newEntry.type === "alchemy") {
      setAlchemy([...alchemy, { ...newEntry, distillation: "Mix", resonance: newEntry.extra || "Variada", id: Date.now() }]);
    }
    
    toast.success("O Culto foi codificado com sucesso.");
    setIsDialogOpen(false);
    setNewEntry({ type: activeTab === "dangers" ? "rituals" : activeTab, name: "", level: 1, rouse_cost: 1, time: "", ingredients: "", system: "", extra: "" });
  };

  const handleDelete = (type: string, name: string) => {
    if(type === "rituals") setRituals(rituals.filter(r => r.name !== name));
    if(type === "oblivion") setOblivion(oblivion.filter(o => o.name !== name));
    if(type === "alchemy") setAlchemy(alchemy.filter(a => a.name !== name));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-blood-glow">Grimório Oculto</h1>
          <p className="text-muted-foreground mt-1 text-sm border-b border-border pb-4 w-fit pr-10">Compêndio de Rituais, Artes Sombrias e Ameaças Sobrenaturais</p>
        </div>
        <div className="flex gap-4">
           {activeTab !== "dangers" && (
             <Button onClick={() => { setNewEntry(prev => ({...prev, type: activeTab})); setIsDialogOpen(true); }} className="gap-2">
               <Plus className="w-4 h-4" /> Registrar Rito
             </Button>
           )}
           <BookOpen className="w-12 h-12 text-blood opacity-20 hidden md:block" />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-border/50 mb-6 pb-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-serif text-sm transition-all whitespace-nowrap
                ${isActive 
                  ? "bg-surface-container-high text-primary border-t border-x border-blood/50 shadow-[0_-2px_10px_rgba(139,0,0,0.1)]" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blood" : "opacity-70"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        
        {/* --- TAB: FEITIÇARIA --- */}
        {activeTab === "rituals" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="font-serif text-xl border-l-4 border-blood pl-3">Tomo Tremere / Banu Haqim</h2>

            <Accordion type="single" collapsible className="bg-surface-container-low border border-blood/20 rounded-md">
              <AccordionItem value="core-rituals" className="border-none">
                 <AccordionTrigger className="px-4 py-3 hover:bg-blood/10 text-blood font-serif text-lg font-bold">
                    [+] Ver Todo o Catálogo V5 Essencial (Regras Oficiais)
                 </AccordionTrigger>
                 <AccordionContent className="p-4 bg-zinc-950/80">
                    <p className="text-xs text-muted-foreground mb-4">Consulte todos os rituais básicos de Feitiçaria listados no corebook de V5, organizados por nível, sem precisar customizar.</p>
                    
                    <Accordion type="multiple" className="w-full space-y-2">
                      {[1, 2, 3, 4, 5].map(level => {
                        const levelRituals = V5_CORE_RITUALS.filter(r => r.level === level);
                        if (levelRituals.length === 0) return null;
                        
                        return (
                          <AccordionItem key={level} value={`level-${level}`} className="border border-border/40 rounded bg-background overflow-hidden">
                             <AccordionTrigger className="px-3 py-2 text-primary text-sm hover:bg-primary/5 uppercase font-bold tracking-widest">
                               Rituais de Nível {level}
                             </AccordionTrigger>
                             <AccordionContent className="p-0">
                                <div className="divide-y divide-border/30">
                                  {levelRituals.map((r, i) => (
                                    <div key={i} className="px-4 py-3">
                                      <h4 className="font-bold text-blood-glow text-sm mb-1">{r.name}</h4>
                                      <p className="text-xs text-muted-foreground/90">{r.desc}</p>
                                    </div>
                                  ))}
                                </div>
                             </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                 </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rituals.map((rit, idx) => (
                <div key={idx} className="bg-card border border-border rounded-md p-4 relative overflow-hidden group">
                  <button onClick={() => handleDelete("rituals", rit.name)} className="absolute top-2 left-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute top-0 right-0 bg-blood text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    Nível {rit.level}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-primary mb-3 pl-6">{rit.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Custo de Sangue</span>
                      <span className="font-bold text-blood">{rit.rouse_cost} Rouse Check</span>
                    </div>
                    <div className="flex justify-between bg-muted/30 p-2 rounded">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Tempo</span>
                      <span className="font-semibold text-foreground/80">{rit.time}</span>
                    </div>
                    <div className="mt-4">
                      <span className="block text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Ingredientes Materiais</span>
                      <p className="text-xs italic bg-surface-container-low p-2 border-l border-border">{rit.ingredients}</p>
                    </div>
                    <Accordion type="single" collapsible className="mt-2 text-xs">
                      <AccordionItem value="sys" className="border-none">
                        <AccordionTrigger className="py-2 text-primary hover:text-primary/70">Mecânica do Sistema</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {rit.system}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: OBLÍVIO --- */}
        {activeTab === "oblivion" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="font-serif text-xl border-l-4 border-zinc-600 pl-3">Cerimônias Necromânticas e Sombrias</h2>

            <Accordion type="single" collapsible className="bg-surface-container-low border border-zinc-600/20 rounded-md">
              <AccordionItem value="core-oblivion" className="border-none">
                 <AccordionTrigger className="px-4 py-3 hover:bg-zinc-800/50 text-zinc-400 font-serif text-lg font-bold">
                    [+] Ver Todo o Catálogo V5 Essencial (Oblívio)
                 </AccordionTrigger>
                 <AccordionContent className="p-4 bg-zinc-950/90">
                    <p className="text-xs text-muted-foreground mb-4">Cerimônias fúnebres de Hecatas, Lasombras e cultistas da morte, extraídas dos tomos oficiais.</p>
                    
                    <Accordion type="multiple" className="w-full space-y-2">
                      {[1, 2, 3, 4, 5].map(level => {
                        const levelObs = V5_CORE_OBLIVION.filter(r => r.level === level);
                        if (levelObs.length === 0) return null;
                        
                        return (
                          <AccordionItem key={level} value={`level-${level}`} className="border border-zinc-700/30 rounded bg-background overflow-hidden">
                             <AccordionTrigger className="px-3 py-2 text-zinc-300 text-sm hover:bg-zinc-800/50 uppercase font-bold tracking-widest">
                               Atos de Nível {level}
                             </AccordionTrigger>
                             <AccordionContent className="p-0">
                                <div className="divide-y divide-zinc-800/50">
                                  {levelObs.map((r, i) => (
                                    <div key={i} className="px-4 py-3">
                                      <h4 className="font-bold text-zinc-400 text-sm mb-1">{r.name}</h4>
                                      <p className="text-xs text-muted-foreground/80">{r.desc}</p>
                                    </div>
                                  ))}
                                </div>
                             </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                 </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {oblivion.map((obl, idx) => (
                <div key={idx} className="bg-background border border-zinc-700/50 rounded-md p-4 relative shadow-[inset_0_0_20px_rgba(20,20,20,0.8)] group">
                  <button onClick={() => handleDelete("oblivion", obl.name)} className="absolute top-2 left-2 text-zinc-500 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    Nível {obl.level}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-zinc-300 mb-3 pl-6">{obl.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between bg-zinc-900/50 p-2 border border-blood/20 rounded">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Gera Mácula (Stains)?</span>
                      <span className="font-bold text-blood animate-pulse">{obl.stains}</span>
                    </div>
                    <div className="flex justify-between bg-zinc-900/50 p-2 rounded">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-widest">Custo de Sangue</span>
                      <span className="font-bold text-red-500">{obl.rouse_cost} Rouse Check</span>
                    </div>
                    <div className="mt-4">
                      <span className="block text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Componentes</span>
                      <p className="text-xs italic bg-zinc-900 p-2 border-l border-zinc-700">{obl.ingredients}</p>
                    </div>
                    <Accordion type="single" collapsible className="mt-2 text-xs">
                      <AccordionItem value="sys" className="border-none">
                        <AccordionTrigger className="py-2 text-zinc-400 hover:text-zinc-200">Mecânica de Conjuração</AccordionTrigger>
                        <AccordionContent className="text-zinc-500 leading-relaxed space-y-2">
                          <p>{obl.system}</p>
                          <p className="text-blood font-semibold bg-blood/10 p-2 rounded inline-block w-full text-[10px] uppercase">Aviso: {obl.danger}</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: ALQUIMIA --- */}
        {activeTab === "alchemy" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-serif text-xl border-l-4 border-yellow-600 pl-3">Destilaria Sangue-Fino</h2>
              <Badge variant="outline" className="text-[10px] border-yellow-600/50 text-yellow-600">Requer Veia Fraca</Badge>
            </div>

            <Accordion type="single" collapsible className="bg-surface-container-low border border-yellow-600/20 rounded-md mb-4">
              <AccordionItem value="core-alchemy" className="border-none">
                 <AccordionTrigger className="px-4 py-3 hover:bg-yellow-900/10 text-yellow-500 font-serif text-lg font-bold">
                    [+] Ver Todo o Catálogo V5 Essencial (Alquimia)
                 </AccordionTrigger>
                 <AccordionContent className="p-4 bg-zinc-950/90">
                    <p className="text-xs text-muted-foreground mb-4">Mutações profanas de sangue-fino e recriações de disciplinas baseadas na essência (Ressonância) do doador.</p>
                    
                    <Accordion type="multiple" className="w-full space-y-2">
                      {[1, 2, 3, 4, 5].map(level => {
                        const levelAlc = V5_CORE_ALCHEMY.filter(r => r.level === level);
                        if (levelAlc.length === 0) return null;
                        
                        return (
                          <AccordionItem key={level} value={`alc-level-${level}`} className="border border-yellow-900/30 rounded bg-background overflow-hidden">
                             <AccordionTrigger className="px-3 py-2 text-yellow-600 text-sm hover:bg-yellow-900/20 uppercase font-bold tracking-widest">
                               Fórmulas de Nível {level}
                             </AccordionTrigger>
                             <AccordionContent className="p-0">
                                <div className="divide-y divide-yellow-900/20">
                                  {levelAlc.map((r, i) => (
                                    <div key={i} className="px-4 py-3">
                                      <h4 className="font-bold text-yellow-500 text-sm mb-1">{r.name}</h4>
                                      <p className="text-xs text-muted-foreground/80">{r.desc}</p>
                                    </div>
                                  ))}
                                </div>
                             </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                 </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {alchemy.map((alch, idx) => (
                <div key={idx} className="bg-card border border-yellow-900/30 rounded-md p-4 relative group">
                  <button onClick={() => handleDelete("alchemy", alch.name)} className="absolute top-2 left-2 text-yellow-900 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute top-0 right-0 bg-yellow-900 text-yellow-100 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    Nível {alch.level}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-yellow-500 mb-3 pl-6">{alch.name}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Método de Destilação</span>
                      <p className="text-xs font-semibold bg-yellow-500/5 p-2 rounded text-yellow-600/80">{alch.distillation}</p>
                    </div>
                    <div>
                      <span className="block text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Extrato de Ressonância</span>
                      <p className="text-xs font-semibold bg-blood/5 p-2 rounded border-l border-blood text-blood-glow">{alch.resonance}</p>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded leading-relaxed border border-border/50">
                      <strong>Mecânica:</strong> {alch.system}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB: DANGERS (PERIGOS DO OCULTISMO) --- */}
        {activeTab === "dangers" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            
            <div className="bg-destructive/10 border-l-4 border-destructive p-5 rounded-r mt-4">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="w-6 h-6 text-destructive" />
                <h3 className="font-serif text-2xl font-bold text-destructive">Fogo, Luz do Sol e Magistérios</h3>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                As fontes mais cruéis de destruição na V5 causam <strong>Dano Agravado não-mitigável (sem testes de Fortitude padrão)</strong>, obliterando a carne imortal diretamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-card border border-border p-5 rounded-md shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 text-blood">
                  <Sparkles className="w-32 h-32" />
                </div>
                <h4 className="font-serif text-lg text-primary flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" /> Dano Agravado Mágico
                </h4>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Armas santificadas, rituais inimigos e relíquias de "Magia Escura" causam cicatrizes instantâneas.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Rolagens de Absorção geralmente são negadas.</li>
                    <li>Um Membro levado ao limite por esse dano entra instantaneamente em Torpor Crítico ou Cinzas (Morte Final).</li>
                  </ul>
                  <div className="bg-surface-container-low p-2 rounded text-xs border border-border/50 mt-2">
                    <strong>Regra Oculta:</strong> Vampiros com nível alto de Fome têm 30% a mais de chance de manifestar a Falha Bestial sob contato mágico, pois a Besta se desespera.
                  </div>
                </div>
              </div>

              <div className="bg-card border border-blue-900/30 p-5 rounded-md shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 text-blue-500">
                  <Cross className="w-32 h-32" />
                </div>
                <h4 className="font-serif text-lg text-blue-400 flex items-center gap-2 mb-3">
                  <Cross className="w-4 h-4" /> Fé Verdadeira (Inquisidores)
                </h4>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    Humanos tocados pelo divino (geralmente veteranos da Segunda Inquisição). É a letalidade encarnada na Fé.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="text-foreground">Repelir:</span> Membros não conseguem avançar contra o Símbolo Sagrado sem passar num teste massivo de Força de Vontade (Dificuldade = Nível de Fé + 2).
                    </li>
                    <li>
                      <span className="text-foreground">Dano por Toque:</span> 1 Dano Agravado *imediato* por turno de exposição ou toque do inquiridor.
                    </li>
                  </ul>
                  <div className="bg-blue-950/20 p-2 rounded text-xs border border-blue-900/30 mt-2 text-blue-200">
                    <strong>Mecânica:</strong> Milagres não exigem rolagens do atacante, eles forçam o Vampiro a "Tirania da Vontade" constante.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* DIALOG DE CRIAÇÃO */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-950 border-border">
           <DialogHeader>
             <DialogTitle className="font-serif text-xl border-l-4 border-blood pl-2">Novo Ritual / Mistério</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 pt-4">
              <div className="space-y-2">
                 <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Classificação da Arte</label>
                 <Select value={newEntry.type} onValueChange={(v) => setNewEntry({...newEntry, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="rituals">Feitiçaria de Sangue</SelectItem>
                       <SelectItem value="oblivion">Cerimônia de Oblívio</SelectItem>
                       <SelectItem value="alchemy">Alquimia Sangue-Fino</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Título do Rito</label>
                 <Input value={newEntry.name} onChange={e => setNewEntry({...newEntry, name: e.target.value})} placeholder="Ex: Círculo Inerente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Nível</label>
                    <Input type="number" min="1" max="5" value={newEntry.level} onChange={e => setNewEntry({...newEntry, level: parseInt(e.target.value) || 1})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Custo de Sede</label>
                    <Input type="number" min="0" max="5" value={newEntry.rouse_cost} onChange={e => setNewEntry({...newEntry, rouse_cost: parseInt(e.target.value) || 0})} />
                 </div>
              </div>
              
              {newEntry.type !== "alchemy" && (
                <>
                  <div className="space-y-2">
                     <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Componentes Materiais</label>
                     <Input value={newEntry.ingredients} onChange={e => setNewEntry({...newEntry, ingredients: e.target.value})} placeholder="Ex: Velas preta, sangue de urvo..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Tempo de Conjuração</label>
                     <Input value={newEntry.time} onChange={e => setNewEntry({...newEntry, time: e.target.value})} placeholder="Ex: 10 minutos" />
                  </div>
                </>
              )}

              {newEntry.type !== "rituals" && (
                <div className="space-y-2">
                   <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                      {newEntry.type === 'oblivion' ? 'Máculas da Trilha/Stains' : 'Ressonância Requerida'}
                   </label>
                   <Input value={newEntry.extra} onChange={e => setNewEntry({...newEntry, extra: e.target.value})} placeholder="Peculiaridades do Rito..." />
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Mecânica de Sistema</label>
                 <Textarea value={newEntry.system} onChange={e => setNewEntry({...newEntry, system: e.target.value})} placeholder="Descreva a rolagem e os efeitos mecânicos..." className="h-24" />
              </div>

              <div className="pt-4 flex justify-end">
                 <Button onClick={handleSave} className="w-full bg-blood hover:bg-red-800 text-white font-bold tracking-wider">
                    Assentar Rito no Códex
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
