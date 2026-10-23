import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Ticket, KeyRound, Copy, Check, RefreshCw, UserCheck, UserX, Share2, Eye, EyeOff } from "lucide-react";

interface PlayerInviteModalProps {
  player: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlayer: (updatedPlayerData: any) => void;
}

function generateRandomToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "NOD-";
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function PlayerInviteModal({ player, isOpen, onClose, onUpdatePlayer }: PlayerInviteModalProps) {
  const { activeChronicle, activeChronicleId } = useAuth();
  
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [linkedUserName, setLinkedUserName] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (player && isOpen) {
      setToken(player.invite_token || generateRandomToken());
      setPassword(player.invite_password || "");
      setCopiedToken(false);
      setCopiedFull(false);

      // Se tiver jogador vinculado, busca o nome no profiles
      if (player.player_id) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", player.player_id)
          .single()
          .then(({ data }) => {
            if (data?.username) {
              setLinkedUserName(data.username);
            } else {
              setLinkedUserName("Jogador Autenticado");
            }
          });
      } else {
        setLinkedUserName(null);
      }
    }
  }, [player, isOpen]);

  if (!player) return null;

  const charName = (player.character_name || player.name || "Sem Nome").trim();
  const chronicleName = activeChronicle?.name || "Grimório da Noite";

  const handleGenerateNewToken = () => {
    setToken(generateRandomToken());
    toast.info("Novo código gerado. Lembre-se de salvar para ativar!");
  };

  const handleSaveInvite = async () => {
    if (!token.trim()) {
      toast.error("O código de convite não pode ficar vazio.");
      return;
    }

    const cleanToken = token.trim().toUpperCase();
    const cleanPassword = password.trim() || null;

    try {
      setIsSaving(true);

      // Garante que a ficha está salva/atualizada em public.players
      const { error } = await supabase.from("players").upsert(
        {
          id: player.id,
          character_name: charName,
          clan: player.clan || null,
          sire: player.sire || null,
          generation: player.generation || 13,
          hunger: player.hunger ?? 0,
          humanity: player.humanity ?? 7,
          health_max: player.health_max ?? 7,
          health_current: player.health_current ?? 7,
          willpower_max: player.willpower_max ?? 5,
          willpower_current: player.willpower_current ?? 5,
          player_id: player.player_id || null,
          chronicle_id: activeChronicleId && activeChronicleId !== "default" ? activeChronicleId : null,
          invite_token: cleanToken,
          invite_password: cleanPassword,
          image_url: player.image_url || null,
          disciplines: typeof player.disciplines === "string" ? player.disciplines : JSON.stringify(player.disciplines || ""),
        },
        { onConflict: "id" }
      );

      if (error) throw error;

      const updated = {
        ...player,
        invite_token: cleanToken,
        invite_password: cleanPassword,
      };

      onUpdatePlayer(updated);
      toast.success("Convite ativado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar convite no banco.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token.trim().toUpperCase());
    setCopiedToken(true);
    toast.success("Código de convite copiado!");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyFullInvite = () => {
    const inviteMessage = `🧛 *Convite para o Grimório: Vampiro a Máscara V5*
🏰 Crônica: ${chronicleName}
👤 Personagem: ${charName} ${player.clan ? `(${player.clan})` : ""}

🔑 Código de Convite (Token): ${token.trim().toUpperCase()}
${password ? `🔒 Senha da Ficha: ${password}` : "🔒 Senha da Ficha: (sem senha)"}

👉 Acesse o Grimório, vá até o Saguão (Lobby) na opção "Sou um Jogador" e insira este código para assumir a ficha!`;

    navigator.clipboard.writeText(inviteMessage);
    setCopiedFull(true);
    toast.success("Mensagem completa de convite copiada!");
    setTimeout(() => setCopiedFull(false), 2500);
  };

  const handleUnlinkPlayer = async () => {
    if (!confirm(`Deseja desvincular o jogador atual da ficha de ${charName}? Ele perderá o acesso e a ficha voltará a ficar disponível para resgate.`)) {
      return;
    }

    try {
      setIsUnlinking(true);
      const { error } = await supabase
        .from("players")
        .update({ player_id: null })
        .eq("id", player.id);

      if (error) throw error;

      const updated = { ...player, player_id: null };
      onUpdatePlayer(updated);
      setLinkedUserName(null);
      toast.success("Jogador desvinculado. A ficha está livre novamente.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao desvincular jogador.");
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-red-950/70 bg-[#09090c] text-zinc-100 shadow-[0_0_30px_rgba(139,0,0,0.25)]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-red-900/60 bg-red-950/40 text-red-400 font-mono text-[10px]">
              Acesso do Jogador
            </Badge>
            {player.player_id ? (
              <Badge variant="outline" className="border-emerald-800 bg-emerald-950/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Vinculado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-800 bg-amber-950/30 text-amber-400 font-mono text-[10px]">
                Aguardando Resgate
              </Badge>
            )}
          </div>
          <DialogTitle className="font-serif text-lg text-zinc-100 flex items-center justify-between">
            <span>Convite: {charName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Envie este código ao seu jogador. Ao entrar no Saguão (Lobby), ele assumirá o controle direto desta ficha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status do Vínculo */}
          {player.player_id && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-400 block font-semibold">Jogador Vinculado</span>
                <span className="text-xs text-zinc-200 font-medium">@{linkedUserName || "Jogador Conectado"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlinkPlayer}
                disabled={isUnlinking}
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 h-8"
              >
                <UserX className="w-3.5 h-3.5 mr-1" /> Desvincular
              </Button>
            </div>
          )}

          {/* Campo: Código de Convite (Token) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="inv-token" className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-red-400" /> Código de Convite (Token)
              </Label>
              <button
                type="button"
                onClick={handleGenerateNewToken}
                className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 font-mono transition-colors"
                title="Gerar outro código aleatório"
              >
                <RefreshCw className="w-3 h-3" /> Gerar Novo
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                id="inv-token"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Ex: NOD-7F9A2B"
                className="bg-zinc-950/80 border-zinc-800 font-mono text-sm tracking-wider uppercase text-red-300 font-bold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyToken}
                className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:text-red-400 shrink-0"
                title="Copiar Código"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Campo: Senha da Ficha */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-pass" className="text-xs text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-red-400" /> Senha de Segurança (Opcional)
            </Label>
            <div className="relative">
              <Input
                id="inv-pass"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe em branco para permitir resgate apenas com o token"
                className="bg-zinc-950/80 border-zinc-800 text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Se você definir uma senha, o jogador precisará digitá-la junto com o token no Saguão.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/30">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyFullInvite}
            className="border-red-950 bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:text-red-200 text-xs gap-1.5"
          >
            {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-red-400" />}
            Copiar Convite Formatado
          </Button>

          <Button
            type="button"
            onClick={handleSaveInvite}
            disabled={isSaving}
            className="bg-red-900 hover:bg-red-800 text-white font-serif tracking-wider text-xs shadow-[0_0_12px_rgba(185,28,28,0.3)] ml-auto"
          >
            {isSaving ? "Salvando..." : "Salvar & Ativar Convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
