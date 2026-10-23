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
  const [isPersisted, setIsPersisted] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [linkedUserName, setLinkedUserName] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (player && isOpen) {
      const initialToken = player.invite_token || generateRandomToken();
      setToken(initialToken);
      setPassword(player.invite_password || "");
      setIsPersisted(Boolean(player.invite_token));
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
    const newToken = generateRandomToken();
    setToken(newToken);
    setIsPersisted(false);
    toast.info("Novo código gerado. Salve ou copie para ativá-lo no banco!");
  };

  const persistInvite = async (tokenToSave?: string, passwordToSave?: string): Promise<string | null> => {
    const rawToken = tokenToSave !== undefined ? tokenToSave : token;
    const rawPass = passwordToSave !== undefined ? passwordToSave : password;

    if (!rawToken.trim()) {
      toast.error("O código de convite não pode ficar vazio.");
      return null;
    }

    const cleanToken = rawToken.trim().toUpperCase();
    const cleanPassword = rawPass.trim() || null;

    try {
      setIsSaving(true);

      const targetChronicleId =
        activeChronicleId && activeChronicleId !== "default"
          ? activeChronicleId
          : null;

      const { data, error } = await supabase.rpc("save_player_invite", {
        p_character_id: player.id,
        p_character_name: charName,
        p_clan: player.clan || null,
        p_sire: player.sire || null,
        p_generation: player.generation || 13,
        p_hunger: player.hunger ?? 0,
        p_humanity: player.humanity ?? 7,
        p_health_max: player.health_max ?? 7,
        p_health_current: player.health_current ?? 7,
        p_willpower_max: player.willpower_max ?? 5,
        p_willpower_current: player.willpower_current ?? 5,
        p_chronicle_id: targetChronicleId,
        p_invite_token: cleanToken,
        p_invite_password: cleanPassword,
        p_image_url: player.image_url || null,
        p_disciplines: typeof player.disciplines === "string" ? player.disciplines : JSON.stringify(player.disciplines || ""),
      });

      if (error) throw error;

      const updated = {
        ...player,
        invite_token: cleanToken,
        invite_password: cleanPassword,
        chronicle_id: data?.chronicle_id || targetChronicleId,
      };

      onUpdatePlayer(updated);
      setIsPersisted(true);
      return cleanToken;
    } catch (err: any) {
      console.error("Erro ao salvar convite:", err);
      toast.error(err.message || "Erro ao salvar convite no banco.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveInvite = async () => {
    const saved = await persistInvite();
    if (saved) {
      toast.success("Convite ativado e sincronizado com o banco de dados!");
    }
  };

  const handleCopyToken = async () => {
    let activeToken = token.trim().toUpperCase();
    // Se o código ainda não foi persistido ou foi alterado, salva no banco antes de copiar
    if (!isPersisted || activeToken !== player.invite_token) {
      const saved = await persistInvite(activeToken, password);
      if (!saved) return;
      activeToken = saved;
    }

    navigator.clipboard.writeText(activeToken);
    setCopiedToken(true);
    toast.success(`Código ${activeToken} copiado e ativo no banco!`);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyFullInvite = async () => {
    let activeToken = token.trim().toUpperCase();
    // Se o código ainda não foi persistido ou foi alterado, salva no banco antes de copiar
    if (!isPersisted || activeToken !== player.invite_token) {
      const saved = await persistInvite(activeToken, password);
      if (!saved) return;
      activeToken = saved;
    }

    const inviteMessage = `🧛 *Convite para o Grimório: Vampiro a Máscara V5*
🏰 Crônica: ${chronicleName}
👤 Personagem: ${charName} ${player.clan ? `(${player.clan})` : ""}

🔑 Código de Convite (Token): ${activeToken}
${password ? `🔒 Senha da Ficha: ${password}` : "🔒 Senha da Ficha: (sem senha)"}

👉 Acesse o Grimório, vá até o Saguão (Lobby) na opção "Sou um Jogador" e insira este código para assumir a ficha!`;

    navigator.clipboard.writeText(inviteMessage);
    setCopiedFull(true);
    toast.success("Mensagem completa copiada e convite ativo no banco!");
    setTimeout(() => setCopiedFull(false), 2500);
  };

  const handleUnlinkPlayer = async () => {
    if (!confirm(`Deseja desvincular o jogador atual da ficha de ${charName}? Ele perderá o acesso e a ficha voltará a ficar disponível para resgate.`)) {
      return;
    }

    try {
      setIsUnlinking(true);
      const { error } = await supabase.rpc("unlink_player_invite", {
        p_character_id: player.id,
      });

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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="border-red-900/60 bg-red-950/40 text-red-400 font-mono text-[10px]">
              Acesso do Jogador
            </Badge>
            {isPersisted ? (
              <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Ativo no Banco
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-800 bg-amber-950/40 text-amber-400 font-mono text-[10px]">
                Código Não Salvo
              </Badge>
            )}
            {player.player_id ? (
              <Badge variant="outline" className="border-emerald-800 bg-emerald-950/30 text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Vinculado
              </Badge>
            ) : (
              <Badge variant="outline" className="border-zinc-800 bg-zinc-950/30 text-zinc-400 font-mono text-[10px]">
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
                onChange={(e) => {
                  setToken(e.target.value.toUpperCase());
                  setIsPersisted(false);
                }}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsPersisted(false);
                }}
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
            className={`font-serif tracking-wider text-xs shadow-[0_0_12px_rgba(185,28,28,0.3)] ml-auto ${
              isPersisted
                ? "bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-900/50"
                : "bg-red-900 hover:bg-red-800 text-white"
            }`}
          >
            {isSaving ? "Salvando..." : isPersisted ? "✓ Convite Ativo & Salvo" : "Salvar & Ativar Convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
