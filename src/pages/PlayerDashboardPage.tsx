import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, BookOpen, Scale, Eye, Sparkles, AlertCircle, Heart, Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlayerDashboardPageProps {
  tab?: "codex" | "boons";
}

export default function PlayerDashboardPage({ tab = "codex" }: PlayerDashboardPageProps) {
  const { user, profile } = useAuth();
  const [character, setCharacter] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca a ficha vinculada a este usuário (player_id = user.id)
  useEffect(() => {
    async function loadCharacter() {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("player_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao carregar ficha do jogador:", error);
        } else {
          setCharacter(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCharacter();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Banner Superior de Boas-Vindas */}
      <div className="relative overflow-hidden rounded-xl border border-red-950/60 bg-gradient-to-r from-red-950/40 via-zinc-950/80 to-black p-6 shadow-[0_0_25px_rgba(139,0,0,0.15)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="border-red-900/60 bg-red-950/40 text-red-400 font-mono text-[10px]">
                Névoa de Guerra Ativa
              </Badge>
              <Badge variant="outline" className="border-zinc-800 bg-zinc-900/60 text-zinc-400 font-mono text-[10px]">
                Sincronizado Supabase RLS
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-zinc-100 tracking-wide">
              {tab === "sheet" && "Santuário do Membro"}
              {tab === "coterie" && "Membros da Coterie"}
              {tab === "codex" && "Códice Público do Domínio"}
              {tab === "boons" && "Livro Público de Dívidas"}
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl mt-1">
              Você está na Visão do Jogador. Conforme os preceitos da Máscara, você tem acesso irrestrito à sua própria ficha e enxerga segredos do domínio revelados pelo Narrador.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-mono block">Status do Sangue</span>
              <span className="text-xs font-semibold text-red-400 flex items-center justify-end gap-1">
                <Flame className="w-3.5 h-3.5" /> Fome: {character?.hunger ?? 1} / 5
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Conteúdo Específico da Tab */}
      {tab === "sheet" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Principal da Ficha */}
          <Card className="md:col-span-2 border-border/50 bg-zinc-950/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-lg text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                {character ? character.character_name : "Personagem Desperto"}
              </CardTitle>
              <CardDescription className="text-xs">
                {character
                  ? `Clã ${character.clan || "Sem Clã"} • ${character.generation || 13}ª Geração`
                  : "Aguardando vinculação do Narrador"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {character ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">Vitalidade</span>
                      <span className="text-base font-bold text-zinc-100">{character.health_current} / {character.health_max}</span>
                    </div>
                    <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">Força de Vontade</span>
                      <span className="text-base font-bold text-zinc-100">{character.willpower_current} / {character.willpower_max}</span>
                    </div>
                    <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono block">Humanidade</span>
                      <span className="text-base font-bold text-zinc-100">{character.humanity} / 10</span>
                    </div>
                    <div className="p-3 bg-zinc-900/60 rounded-lg border border-red-950/60">
                      <span className="text-[10px] text-red-400 uppercase font-mono block">Fome</span>
                      <span className="text-base font-bold text-red-400">{character.hunger} / 5</span>
                    </div>
                  </div>

                  {character.disciplines && (
                    <div className="p-3 rounded-lg bg-zinc-900/40 border border-border/40">
                      <span className="text-[11px] font-semibold text-zinc-300 block mb-1">Disciplinas do Sangue</span>
                      <p className="text-xs text-zinc-400">{character.disciplines}</p>
                    </div>
                  )}

                  {character.human_history && (
                    <div className="p-3 rounded-lg bg-zinc-900/40 border border-border/40">
                      <span className="text-[11px] font-semibold text-zinc-300 block mb-1">Histórico Mortal</span>
                      <p className="text-xs text-zinc-400 line-clamp-3">{character.human_history}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 px-4 border border-dashed border-zinc-800 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-amber-500/80 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-zinc-200">Nenhum personagem vinculado ao seu usuário</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                    O Narrador da sua crônica precisa vincular o seu ID de jogador (<code className="text-red-400 font-mono text-[10px]">{user?.id}</code>) à sua ficha na tabela de coterie.
                  </p>
                  <Badge variant="secondary" className="bg-zinc-900 text-zinc-400 text-[10px]">
                    Assim que vinculado, seus atributos aparecerão automaticamente aqui.
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dicas Rápidas do Sistema V5 */}
          <Card className="border-border/50 bg-zinc-950/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-serif text-sm text-zinc-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                Preceitos do Sistema V5
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-zinc-400">
              <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200 block mb-0.5">Rolagens D10</span>
                <span>Dificuldade padrão: sucessos em 6 ou mais. Pares de 10 geram Acertos Críticos.</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80">
                <span className="font-semibold text-red-400 block mb-0.5">Dados de Fome</span>
                <span>Substituem dados normais igual ao seu nível de Fome. Cuidado com Falhas Bestiais (1) e Críticos Bagunçados (10)!</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800/80">
                <span className="font-semibold text-zinc-200 block mb-0.5">Névoa de Guerra</span>
                <span>NPCs, locais e rumores só se tornam visíveis para você quando o Narrador torná-los públicos.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Placeholder imersivo para as demais abas */}
      {tab !== "sheet" && (
        <Card className="border-border/50 bg-zinc-950/60 backdrop-blur-sm text-center py-12 px-4">
          <CardContent className="space-y-3 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_20px_rgba(185,28,28,0.2)]">
              {tab === "coterie" && <Users className="w-6 h-6" />}
              {tab === "codex" && <BookOpen className="w-6 h-6" />}
              {tab === "boons" && <Scale className="w-6 h-6" />}
            </div>
            <h3 className="font-serif text-lg font-bold text-zinc-100">
              {tab === "coterie" && "Visão da Coterie"}
              {tab === "codex" && "Códice Público do Domínio"}
              {tab === "boons" && "Livro Público de Dívidas"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este módulo de jogador está filtrando os dados do banco Supabase em tempo real com Row Level Security. Apenas itens com a flag <code className="text-red-400 font-mono text-[10px]">is_public = true</code> serão visíveis aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
