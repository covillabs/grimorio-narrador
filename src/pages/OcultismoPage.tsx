import { useState } from "react";
import { BookOpen, Droplets, Skull, FlaskConical, Flame, ShieldAlert, Cross, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const TABS = [
  { id: "rituals", label: "Feitiçaria de Sangue", icon: Droplets },
  { id: "oblivion", label: "Cerimônias de Oblívio", icon: Skull },
  { id: "alchemy", label: "Alquimia Sangue-Fino", icon: FlaskConical },
  { id: "dangers", label: "Perigos do Ocultismo", icon: Flame },
];

export default function OcultismoPage() {
  const [activeTab, setActiveTab] = useState("rituals");

  const mockRituals = [
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

  const mockOblivion = [
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

  const mockAlchemy = [
    {
      name: "Proficiência Nebulosa",
      level: 2,
      distillation: "Calcinatio (No próprio sangue do criador)",
      resonance: "Sanguínea (Desejo/Exaltação)",
      system: "Rolagem: Vigor + Alquimia (Dificuldade 3). Concede Rapidez 1 ao alquimista. A validade do sangue estabilizado no sistema é de uma noite.",
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-blood-glow">Grimório Oculto</h1>
          <p className="text-muted-foreground mt-1 text-sm border-b border-border pb-4 w-fit pr-10">Compêndio de Rituais, Artes Sombrias e Ameaças Sobrenaturais</p>
        </div>
        <BookOpen className="w-12 h-12 text-blood opacity-20" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockRituals.map((rit, idx) => (
                <div key={idx} className="bg-card border border-border rounded-md p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-blood text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    Nível {rit.level}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-primary mb-3">{rit.name}</h3>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockOblivion.map((obl, idx) => (
                <div key={idx} className="bg-background border border-zinc-700/50 rounded-md p-4 relative shadow-[inset_0_0_20px_rgba(20,20,20,0.8)]">
                  <div className="absolute top-0 right-0 bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    Nível {obl.level}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-zinc-300 mb-3">{obl.name}</h3>
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
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl border-l-4 border-yellow-600 pl-3">Destilaria Sangue-Fino</h2>
              <Badge variant="outline" className="text-[10px] border-yellow-600/50 text-yellow-600">Requer Veia Fraca</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {mockAlchemy.map((alch, idx) => (
                <div key={idx} className="bg-card border border-yellow-900/30 rounded-md p-4 relative">
                  <div className="absolute top-0 right-0 bg-yellow-900 text-yellow-100 text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    Nível {alch.level}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-yellow-500 mb-3">{alch.name}</h3>
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
    </div>
  );
}
