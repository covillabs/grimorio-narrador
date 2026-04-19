import { useState, useEffect } from "react";
import { Plus, Calendar, Skull, Link as LinkIcon, Sparkles, BookOpen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export default function DiarioPage() {
  const [scratchpad, setScratchpad] = useState(() => {
    return localStorage.getItem("v5_scratchpad") || "• Investigar a doca 4.\n• Lucien deve responder pelo que disse ao Barão.\n• Lembrete: Nosferatu da esgoto tem informações sobre a 2ª Inquisição.";
  });
  
  const [viewMode, setViewMode] = useState<Record<string, "resumo" | "ganchos">>({});

  const [sessions, setSessions] = useState<any[]>(() => {
    const saved = localStorage.getItem("v5_sessions");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "2",
        title: "Sessão 02: Ecos de Fogo",
        date: "14 de Novembro de 2024",
        summary: "A coterie investigou as ruínas do antigo Haven Brujah incendiado. Descobriram que o mandante não foi a Segunda Inquisição, mas sim agentes infiltrados cruzando ordens do próprio Príncipe. Ocorreu um tenso embate com Carniçais rebeldes nas vielas.",
        hooks: "Quem dentro da Camarilla entregou a localização Brujah? Onde está o diário perdido do Ancião que queimou? O Barão Zora ainda não sabe desse envolvimento.",
        xp: "2 XP Distribuidos",
        stains: "Lucien: Mácula (Destruição de propriedade sagrada). Kaleb: 2 Máculas (Assassinato não provocado).",
        resonance: "Melancólica consumida do sobrevivente do fogo."
      },
      {
        id: "1",
        title: "Sessão 01: O Abraço e a Queda",
        date: "07 de Novembro de 2024",
        summary: "Nossa primeira noite. O grupo foi reunido à força por convocação da Xerife sob a alegação de acobertamento de Mascote. Encontro com Barão Zora que exigiu lealdade imediata. A Inquisição atacou as docas no meio da negociação.",
        hooks: "Por que a Xerife os escolheu, entre tantos Neófitos? O que a Inquisição procurava nos contêineres?",
        xp: "1 XP Distribuído",
        stains: "Nenhum princípio quebrado.",
        resonance: "Sanguínea / Colérica."
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("v5_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("v5_scratchpad", scratchpad);
  }, [scratchpad]);

  const handleToggleView = (id: string, mode: "resumo" | "ganchos") => {
    setViewMode((prev) => ({ ...prev, [id]: mode }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-blood-glow">Diário da Crônica</h1>
          <p className="text-muted-foreground mt-1">Timeline de Sessões, Metatrama e Tracker de Experiência</p>
        </div>
        <Button onClick={() => toast.info("Novos registros requerem banco de dados plugado.")} className="gap-2">
          <Plus className="w-4 h-4" /> Registrar Noite
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Esquerdo: TIMELINE DA CRÔNICA */}
        <div className="lg:col-span-8 flex flex-col space-y-6 relative pb-10">
          {/* Linha vertical (red string) */}
          <div className="absolute left-8 top-4 bottom-0 w-1 bg-blood/20 rounded-full z-0 origin-top"></div>

          {sessions.map((sess, idx) => (
            <div key={sess.id} className="relative z-10 flex gap-6 group">
              {/* Timeline Node */}
              <div className="flex flex-col items-center mt-2">
                <div className="w-5 h-5 rounded-full bg-blood border-4 border-background group-hover:shadow-[0_0_10px_rgba(255,0,0,0.8)] transition-shadow"></div>
              </div>
              
              {/* Session Card */}
              <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden shadow-lg group-hover:border-primary/40 transition-colors">
                
                {/* Cabeçalho da Sessão */}
                <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-primary flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blood" />
                      {sess.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Calendar className="w-3 h-3" />
                      {sess.date}
                    </div>
                  </div>
                  
                  {/* Toggles (Resumo vs Ganchos) */}
                  <div className="flex bg-background border border-border rounded-md overflow-hidden self-start md:self-auto">
                    <button 
                      onClick={() => handleToggleView(sess.id, "resumo")}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${viewMode[sess.id] !== "ganchos" ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                      Sumário
                    </button>
                    <button 
                      onClick={() => handleToggleView(sess.id, "ganchos")}
                      className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-1 ${viewMode[sess.id] === "ganchos" ? 'bg-destructive/80 text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                      <LinkIcon className="w-3 h-3" /> Ganchos
                    </button>
                  </div>
                </div>

                {/* Área Dinâmica baseada no Toggle */}
                <div className="p-5 font-body text-sm text-foreground/80 leading-relaxed min-h-[100px]">
                  {viewMode[sess.id] === "ganchos" ? (
                    <div className="bg-destructive/5 text-destructive-foreground border-l-2 border-destructive p-3 italic">
                      <h4 className="font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Mistérios Soltos</h4>
                      {sess.hooks}
                    </div>
                  ) : (
                    <p>{sess.summary}</p>
                  )}
                </div>

                {/* Trackers da Metatrama (Sempre Visível) */}
                <div className="p-4 bg-surface-container-low border-t border-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-600 mt-1" />
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground">Evolução</span>
                      <span className="text-xs font-bold text-yellow-600/80">{sess.xp}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Skull className="w-4 h-4 text-blood mt-1" />
                    <div>
                      <span className="block text-[9px] uppercase tracking-widest text-muted-foreground text-blood">Princípios Quebrados</span>
                      <span className="text-xs font-semibold leading-tight block mt-0.5">{sess.stains}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] mt-1 shrink-0 uppercase">Ressonância do Dia</Badge>
                    <span className="text-xs text-muted-foreground italic mt-1">{sess.resonance}</span>
                  </div>
                </div>
                
              </div>
            </div>
          ))}
        </div>

        {/* Lado Direito: SCRATCHPAD DO MESTRE */}
        <div className="lg:col-span-4 h-full hidden lg:block sticky top-0">
          <div className="h-[calc(100vh-14rem)] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col relative overflow-hidden group hover:border-zinc-700 transition-colors">
            
            {/* Header Sticky Notepad */}
            <div className="bg-zinc-900 border-b border-blood/20 p-3 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-blood" />
              <h3 className="font-serif text-sm font-bold text-zinc-300 uppercase tracking-widest">Anotações Rápidas</h3>
            </div>
            
            {/* Text Area */}
            <Textarea 
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Digite aqui ideias, ganchos e pontuações no calor do momento..."
              className="flex-1 bg-transparent border-none resize-none focus-visible:ring-0 rounded-none p-4 font-mono text-xs text-zinc-400 placeholder:text-zinc-700 leading-relaxed"
            />
            
            <div className="bg-zinc-900 p-2 text-center text-[9px] text-zinc-600 uppercase tracking-widest">
              Salvo automaticamente na memória (Mockup)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
