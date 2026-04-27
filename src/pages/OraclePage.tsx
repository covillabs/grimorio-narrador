import { useState } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Sparkles, Search, MessageSquare, Book, History, Send, BrainCircuit, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface OracleQuery {
  id: string;
  question: string;
  answer: string | null;
  status: "pending" | "processing" | "answered";
  timestamp: string;
}

export default function OraclePage() {
  const [queries, setQueries] = useCloudStorage<OracleQuery[]>("v5_oracle_queries", []);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);

  const handleAsk = () => {
    if (!currentQuestion.trim()) return;

    const newQuery: OracleQuery = {
      id: Date.now().toString(),
      question: currentQuestion,
      answer: null,
      status: "pending",
      timestamp: new Date().toLocaleString(),
    };

    setQueries([newQuery, ...queries]);
    setCurrentQuestion("");
    toast.success("Pergunta enviada ao Oráculo!", {
      description: "O narrador (ou a IA) responderá em breve nas sombras.",
    });

    // Simulação de "Pensando" para feedback visual
    setIsConsulting(true);
    setTimeout(() => setIsConsulting(false), 3000);
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto pb-10">
      <div className="mb-8 border-b border-blood/20 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blood/10 rounded-full border border-blood/30 shadow-[0_0_20px_rgba(139,0,0,0.2)] animate-pulse">
            <Sparkles className="w-8 h-8 text-blood-glow" />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-black text-white tracking-widest uppercase">
              Oráculo de Lore
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Consulta Inteligente aos Manuais Oficiais da 5ª Edição
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Pergunta */}
      <div className="bg-card/50 border border-blood/20 p-8 rounded-2xl shadow-2xl backdrop-blur-sm mb-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Book className="w-32 h-32 text-white" />
        </div>
        
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-serif font-bold text-white uppercase tracking-wider">O que deseja saber, Neófito?</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">As respostas estão escritas no sangue dos manuais.</p>
          </div>

          <div className="relative">
            <Input 
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              placeholder="Ex: Quais as penalidades de um Brujah em Frenzy?"
              className="h-14 bg-background/80 border-blood/30 focus:border-blood text-lg pl-12 pr-24 rounded-xl shadow-inner"
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Button 
              onClick={handleAsk}
              disabled={isConsulting || !currentQuestion.trim()}
              className="absolute right-2 top-2 h-10 bg-blood hover:bg-blood/80 text-white font-bold px-6 rounded-lg transition-all"
            >
              {isConsulting ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Send className="w-4 h-4 mr-2" /> Perguntar</>}
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
             <span className="text-[10px] text-muted-foreground uppercase tracking-widest mr-2 py-1">Tópicos Sugeridos:</span>
             <button onClick={() => setCurrentQuestion("Penalidades de Frenzy")} className="text-[10px] bg-muted/30 hover:bg-blood/20 px-2 py-1 rounded border border-border/50 transition-colors uppercase">Frenzy</button>
             <button onClick={() => setCurrentQuestion("Ressonância Sanguínea")} className="text-[10px] bg-muted/30 hover:bg-blood/20 px-2 py-1 rounded border border-border/50 transition-colors uppercase">Ressonância</button>
             <button onClick={() => setCurrentQuestion("Regras de Humanidade")} className="text-[10px] bg-muted/30 hover:bg-blood/20 px-2 py-1 rounded border border-border/50 transition-colors uppercase">Humanidade</button>
             <button onClick={() => setCurrentQuestion("Potência de Sangue")} className="text-[10px] bg-muted/30 hover:bg-blood/20 px-2 py-1 rounded border border-border/50 transition-colors uppercase">Potência</button>
          </div>
        </div>
      </div>

      {/* Histórico de Consultas */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 mb-4">
          <History className="w-4 h-4" /> Histórico de Revelações
        </h3>

        {queries.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl opacity-30">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p className="font-serif italic text-lg">Nenhuma consulta foi feita ao Oráculo ainda.</p>
          </div>
        ) : (
          queries.map((q) => (
            <div key={q.id} className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-lg transition-all hover:border-blood/30">
              <div className="p-4 bg-muted/20 flex justify-between items-center border-b border-border/30">
                <div className="flex items-center gap-3">
                  <Badge variant={q.status === 'answered' ? 'default' : 'outline'} className={q.status === 'answered' ? 'bg-green-900/30 text-green-400 border-green-900' : 'animate-pulse text-yellow-500 border-yellow-900'}>
                    {q.status === 'answered' ? 'REVELADO' : 'NAS SOMBRAS...'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">{q.timestamp}</span>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Search className="w-4 h-4 text-primary" />
                   </div>
                   <p className="font-serif text-lg text-white/90 italic leading-snug">"{q.question}"</p>
                </div>

                {q.answer ? (
                  <div className="mt-4 flex gap-4 bg-blood/5 p-4 rounded-lg border-l-2 border-blood animate-in fade-in slide-in-from-left-2 duration-500">
                     <div className="w-8 h-8 rounded-full bg-blood/20 flex items-center justify-center shrink-0 border border-blood/30">
                        <Sparkles className="w-4 h-4 text-blood-glow" />
                     </div>
                     <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                        <div className="whitespace-pre-wrap">{q.answer}</div>
                        <div className="pt-2 flex items-center gap-1 text-[10px] text-blood-glow opacity-60 uppercase tracking-widest font-bold">
                           <ShieldAlert className="w-3 h-3" /> Fonte: Manuais Oficiais V5
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground italic pl-12 opacity-60">
                    <div className="flex gap-1">
                       <div className="w-1.5 h-1.5 bg-blood rounded-full animate-bounce" />
                       <div className="w-1.5 h-1.5 bg-blood rounded-full animate-bounce [animation-delay:0.2s]" />
                       <div className="w-1.5 h-1.5 bg-blood rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    Aguardando a voz dos Antigos...
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
