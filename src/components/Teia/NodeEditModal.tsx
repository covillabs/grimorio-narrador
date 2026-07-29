import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Ghost, UserCheck, Crown, Skull } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  nodeData: any | null;
  nodeId: string | null;
  nodeType: string | null;
  onSave: (nodeId: string, updates: Record<string, any>) => void;
  onDelete: (nodeId: string) => void;
}

const FACTIONS = ["Coterie", "Camarilla", "Anarch", "Sabá", "Mortal", "Independente", "Autárquico", "Ghoul"];
const STATUSES = [
  { value: "active", label: "Ativo", color: "text-green-400" },
  { value: "Ativo", label: "Ativo", color: "text-green-400" },
  { value: "damaged", label: "Ferido", color: "text-amber-400" },
  { value: "Ferido", label: "Ferido", color: "text-amber-400" },
  { value: "destroyed", label: "Destruído", color: "text-rose-400" },
  { value: "Morte Final", label: "Morte Final", color: "text-rose-500" },
];

export function NodeEditModal({ open, onClose, nodeData, nodeId, nodeType, onSave, onDelete }: Props) {
  const [label, setLabel] = useState("");
  const [role, setRole] = useState("");
  const [faction, setFaction] = useState("");
  const [status, setStatus] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Sincroniza quando abre
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && nodeData) {
      setLabel(nodeData.label || "");
      setRole(nodeData.role || "");
      setFaction(nodeData.faction || nodeData.sect || "");
      setStatus(nodeData.status || "active");
      setImageUrl(nodeData.image || "");
    }
    if (!isOpen) onClose();
  };

  const handleSave = () => {
    if (!nodeId) return;
    onSave(nodeId, {
      label: label.trim() || nodeData?.label,
      role: role.trim(),
      faction: faction,
      sect: faction,
      status: status,
      image: imageUrl.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!nodeId) return;
    onDelete(nodeId);
    onClose();
  };

  if (!nodeData || !nodeId) return null;

  const isCoterie = nodeType === "coterieNode";
  const isVampire = nodeType === "vampireNode";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm bg-background/95 backdrop-blur-xl border-border/60">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            Editar Nó
            {nodeData.type === "touchstone" && <UserCheck className="w-4 h-4 text-blue-400" />}
            {nodeData.type === "npc" && <Ghost className="w-4 h-4 text-muted-foreground" />}
            {nodeData.type === "vampire" && <Crown className="w-4 h-4 text-red-400" />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 my-1">
          {/* Nome */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Nome</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-sm font-semibold"
              disabled={isCoterie}
            />
          </div>

          {/* Cargo / Papel */}
          {!isCoterie && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Cargo / Papel</label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Príncipe, Xerife, Barão, Pilar..."
                className="text-sm"
              />
            </div>
          )}

          {/* Facção */}
          {!isCoterie && !isVampire && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Facção / Seita</label>
              <Select value={faction} onValueChange={setFaction}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecionar facção..." />
                </SelectTrigger>
                <SelectContent>
                  {FACTIONS.map((f) => (
                    <SelectItem key={f} value={f} className="text-sm">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          {!isCoterie && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-sm text-green-400">✦ Ativo</SelectItem>
                  <SelectItem value="damaged" className="text-sm text-amber-400">⚠ Ferido</SelectItem>
                  <SelectItem value="Morte Final" className="text-sm text-rose-400">💀 Morte Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Imagem */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">URL do Retrato</label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="mt-2 flex justify-between">
          {!isCoterie && !isVampire && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1 mr-auto">
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <Pencil className="w-3.5 h-3.5" /> Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
