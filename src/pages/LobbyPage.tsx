import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Crown, Sparkles, KeyRound, Ticket, ArrowRight, Loader2, LogOut, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function LobbyPage() {
  const { user, profile, signOut, refreshChronicles, setActiveChronicleId } = useAuth();
  const navigate = useNavigate();

  // Estados do Narrador (Criar Crônica)
  const [chronicleName, setChronicleName] = useState("");
  const [chronicleDesc, setChronicleDesc] = useState("");
  const [isCreatingChronicle, setIsCreatingChronicle] = useState(false);

  // Estados do Jogador (Resgatar Convite)
  const [inviteToken, setInviteToken] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [isClaimingInvite, setIsClaimingInvite] = useState(false);

  // Lista de Crônicas já existentes do usuário
  const [myChronicles, setMyChronicles] = useState<any[]>([]);
  const [loadingChronicles, setLoadingChronicles] = useState(true);

  const fetchMyChronicles = async () => {
    if (!user) return;
    try {
      setLoadingChronicles(true);
      const { data, error } = await supabase
        .from("chronicle_members")
        .select("chronicle_id, role, chronicles(id, name, description, narrator_id)")
        .eq("user_id", user.id);

      if (error) throw error;
      setMyChronicles(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar crônicas:", err);
    } finally {
      setLoadingChronicles(false);
    }
  };

  useEffect(() => {
    fetchMyChronicles();
  }, [user]);

  // Handler: Narrador cria crônica
  const handleCreateChronicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chronicleName.trim()) {
      toast.error("O nome da crônica é obrigatório.");
      return;
    }

    try {
      setIsCreatingChronicle(true);
      const { data, error } = await supabase.rpc("create_chronicle", {
        p_name: chronicleName.trim(),
        p_description: chronicleDesc.trim() || null,
      });

      if (error) throw error;

      toast.success(`Crônica "${chronicleName}" erguida com sucesso!`);
      if (setActiveChronicleId) {
        setActiveChronicleId(data.chronicle_id);
      } else {
        localStorage.setItem("v5_active_chronicle_id", data.chronicle_id);
      }
      if (refreshChronicles) await refreshChronicles();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar crônica.");
    } finally {
      setIsCreatingChronicle(false);
    }
  };

  // Handler: Jogador resgata ficha com convite
  const handleClaimInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      toast.error("Informe o código de convite.");
      return;
    }

    try {
      setIsClaimingInvite(true);
      const cleanToken = inviteToken.trim().toUpperCase();
      const cleanPassword = invitePassword.trim() || null;

      const { data, error } = await supabase.rpc("claim_player_invite", {
        p_invite_token: cleanToken,
        p_invite_password: cleanPassword,
      });

      if (error) throw error;

      toast.success(`Personagem "${data.character_name}" desperto com sucesso!`);
      if (data.chronicle_id) {
        if (setActiveChronicleId) {
          setActiveChronicleId(data.chronicle_id);
        } else {
          localStorage.setItem("v5_active_chronicle_id", data.chronicle_id);
        }
      }
      if (refreshChronicles) await refreshChronicles();
      navigate("/player");
    } catch (err: any) {
      toast.error(err.message || "Código ou senha de convite inválidos.");
    } finally {
      setIsClaimingInvite(false);
    }
  };

  const handleSelectExisting = (chronicleId: string, role: string) => {
    if (setActiveChronicleId) {
      setActiveChronicleId(chronicleId);
    } else {
      localStorage.setItem("v5_active_chronicle_id", chronicleId);
    }
    if (role === "narrator") {
      navigate("/");
    } else {
      navigate("/player");
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-foreground flex flex-col selection:bg-red-950 selection:text-red-200">
      {/* Header do Saguão */}
      <header className="h-16 border-b border-border/40 bg-[#09090c]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-red-950 via-red-900 to-black border border-red-800/50 flex items-center justify-center shadow-[0_0_15px_rgba(185,28,28,0.3)]">
            <Sparkles className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-zinc-100 tracking-wider">
              Grimório Narrador
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">Saguão de Entrada • Portão da Máscara</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1 rounded-full">
            <Avatar className="w-6 h-6 border border-zinc-700">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-zinc-800 text-[10px]">
                {(profile?.username || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-zinc-300 font-medium hidden sm:inline-block">
              {profile?.username || user?.user_metadata?.username || user?.email}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <Badge variant="outline" className="border-red-900/60 bg-red-950/40 text-red-400 text-xs font-mono uppercase tracking-widest px-3 py-0.5">
            Onboarding Multi-Crônicas
          </Badge>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-100 tracking-wide">
            Bem-vindo ao Santuário da Meia-Noite
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Escolha como deseja ingressar no Mundo das Trevas: comande seu próprio domínio como Narrador ou responda ao convite do seu Mestre para assumir sua ficha de Membro.
          </p>
        </div>

        {/* Grade de 2 Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Sou um Narrador */}
          <Card className="border-red-950/60 bg-gradient-to-b from-zinc-950/90 to-[#0c090a] shadow-[0_0_25px_rgba(139,0,0,0.12)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-red-950/50 border border-red-900/60 flex items-center justify-center text-red-400 mb-2 shadow-[0_0_12px_rgba(185,28,28,0.25)]">
                <Crown className="w-5 h-5" />
              </div>
              <CardTitle className="font-serif text-lg text-zinc-100">Sou um Narrador</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Crie uma crônica totalmente nova para governar sua coterie, NPCs, Atlas e Névoa de Guerra.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCreateChronicle}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chr-name" className="text-xs text-zinc-300">Nome da Crônica</Label>
                  <Input
                    id="chr-name"
                    placeholder="Ex: Sangue e Cinzas em Boston"
                    value={chronicleName}
                    onChange={(e) => setChronicleName(e.target.value)}
                    className="bg-zinc-900/60 border-zinc-800 text-sm focus:border-red-800"
                    disabled={isCreatingChronicle}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chr-desc" className="text-xs text-zinc-300">Premissa / Descrição (Opcional)</Label>
                  <Input
                    id="chr-desc"
                    placeholder="Ex: Uma disputa velada entre Anarquistas e a Camarilla."
                    value={chronicleDesc}
                    onChange={(e) => setChronicleDesc(e.target.value)}
                    className="bg-zinc-900/60 border-zinc-800 text-sm focus:border-red-800"
                    disabled={isCreatingChronicle}
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isCreatingChronicle}
                  className="w-full bg-red-900 hover:bg-red-800 text-white font-serif tracking-wider shadow-[0_0_15px_rgba(185,28,28,0.3)]"
                >
                  {isCreatingChronicle ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Erguendo Domínio...
                    </>
                  ) : (
                    <>
                      Criar Nova Crônica
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Card B: Sou um Jogador */}
          <Card className="border-border/60 bg-gradient-to-b from-zinc-950/90 to-zinc-950/60 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 mb-2">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <CardTitle className="font-serif text-lg text-zinc-100">Sou um Jogador</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Recebeu um convite do seu Narrador? Insira o código e a senha da ficha para se vincular ao seu vampiro.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleClaimInvite}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-xs text-zinc-300 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-red-400" /> Código de Convite (Token)
                  </Label>
                  <Input
                    id="token"
                    placeholder="Ex: NOD-7F9A2B ou token do convite"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    className="bg-zinc-900/60 border-zinc-800 font-mono text-sm focus:border-red-800 uppercase"
                    disabled={isClaimingInvite}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw" className="text-xs text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-red-400" /> Senha da Ficha (se houver)
                  </Label>
                  <Input
                    id="pw"
                    type="password"
                    placeholder="Senha definida pelo Narrador"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    className="bg-zinc-900/60 border-zinc-800 text-sm focus:border-red-800"
                    disabled={isClaimingInvite}
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isClaimingInvite}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-serif tracking-wider border border-zinc-700"
                >
                  {isClaimingInvite ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Vinculando Ficha...
                    </>
                  ) : (
                    <>
                      Despertar Personagem
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Seção Inferior: Suas Crônicas Existentes */}
        {!loadingChronicles && myChronicles.length > 0 && (
          <div className="p-6 rounded-xl border border-border/40 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <h3 className="font-serif text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-400" />
              Suas Crônicas Ativas ({myChronicles.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {myChronicles.map((item) => (
                <div
                  key={item.chronicle_id}
                  onClick={() => handleSelectExisting(item.chronicle_id, item.role)}
                  className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-red-900/60 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif text-sm font-bold text-zinc-100 group-hover:text-red-300 transition-colors">
                        {item.chronicles?.name || "Crônica sem título"}
                      </span>
                      <Badge variant="outline" className={`text-[10px] uppercase font-mono ${item.role === 'narrator' ? 'border-red-900/60 text-red-400 bg-red-950/30' : 'border-zinc-700 text-zinc-400'}`}>
                        {item.role === 'narrator' ? 'Narrador' : 'Jogador'}
                      </Badge>
                    </div>
                    {item.chronicles?.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{item.chronicles.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-red-400 font-medium flex items-center gap-1 mt-3">
                    Entrar na crônica <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
