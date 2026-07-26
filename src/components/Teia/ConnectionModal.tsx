import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Droplets, Swords, HandHeart, ScrollText } from "lucide-react";

export interface ConnectionParams {
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  params: ConnectionParams | null;
  onConfirm: (type: string, label: string) => void;
}

const LINK_TYPES = [
  { id: "Touchstone", label: "Aliado / Pilar", icon: HandHeart, color: "text-blue-400", border: "border-blue-500/50 hover:border-blue-400", bg: "hover:bg-blue-950/40" },
  { id: "BloodBond", label: "Laço de Sangue", icon: Droplets, color: "text-red-400", border: "border-red-500/50 hover:border-red-400", bg: "hover:bg-red-950/40" },
  { id: "Enemy", label: "Rivalidade / Inimigo", icon: Swords, color: "text-rose-400", border: "border-rose-500/50 hover:border-rose-400", bg: "hover:bg-rose-950/40" },
  { id: "Boon", label: "Dívida (Boon)", icon: ScrollText, color: "text-amber-400", border: "border-amber-500/50 hover:border-amber-400", bg: "hover:bg-amber-950/40" },
  { id: "Sire", label: "Criador / Sire", icon: Link2, color: "text-yellow-400", border: "border-yellow-500/50 hover:border-yellow-400", bg: "hover:bg-yellow-950/40" },
];

export function ConnectionModal({ open, onClose, params, onConfirm }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");

  const handleConfirm = () => {
    if (!selected) return;
    const typeInfo = LINK_TYPES.find((t) => t.id === selected);
    const label = customLabel.trim() || typeInfo?.label || "Vínculo";
    onConfirm(selected, label);
    setSelected(null);
    setCustomLabel("");
    onClose();
  };

  if (!params) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelected(null); setCustomLabel(""); } }}>
      <DialogContent className="max-w-sm bg-background/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Criar Vínculo
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-bold text-foreground">{params.sourceName}</span>
            {" → "}
            <span className="font-bold text-foreground">{params.targetName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {LINK_TYPES.map((lt) => (
            <button
              key={lt.id}
              type="button"
              onClick={() => setSelected(lt.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${lt.border} ${lt.bg} ${
                selected === lt.id ? "bg-primary/15 border-primary ring-1 ring-primary/30" : "bg-card/30"
              }`}
            >
              <lt.icon className={`w-5 h-5 ${lt.color}`} />
              <span className="text-sm font-semibold text-foreground">{lt.label}</span>
            </button>
          ))}
        </div>

        <Input
          placeholder="Descrição personalizada (opcional)..."
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          className="text-xs"
        />

        <DialogFooter className="mt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" disabled={!selected} onClick={handleConfirm} className="gap-1">
            <Link2 className="w-4 h-4" /> Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
