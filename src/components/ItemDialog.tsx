import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { Trash2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const CATEGORIES = ["Arma", "Ferramenta de Investigação", "Artefato Místico", "Documento"];
const RULE_TYPES = ["PASSIVO", "REATIVO", "GATILHO", "AÇÃO", "BÔNUS"] as const;

export interface ItemRule {
  id: string;
  type: typeof RULE_TYPES[number];
  title: string;
  description: string;
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  onDelete?: (id: string) => void;
  players: { id: string; character_name: string }[];
  npcs: { id: string; name: string }[];
  onSave: (item: any) => void;
}

const defaultItem = {
  name: "", category: "Artefato Místico", description: "",
  owner_type: "" as string, owner_id: "" as string, image_url: "",
};

export function ItemDialog({ open, onOpenChange, item, onDelete, players, npcs, onSave }: ItemDialogProps) {
  const [form, setForm] = useState(defaultItem);
  const [rules, setRules] = useState<ItemRule[]>([]);
  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      let parsedRules: ItemRule[] = [];
      if (Array.isArray(item.rules_bonus)) {
        parsedRules = item.rules_bonus;
      } else if (typeof item.rules_bonus === "string" && item.rules_bonus.trim()) {
        try {
          const json = JSON.parse(item.rules_bonus);
          if (Array.isArray(json)) parsedRules = json;
          else throw new Error();
        } catch {
          parsedRules = [{
            id: crypto.randomUUID(),
            type: "PASSIVO",
            title: "Efeito Mecânico",
            description: item.rules_bonus
          }];
        }
      }
      setRules(parsedRules);
      setForm({ ...defaultItem, ...item, owner_type: item.owner_type || "", owner_id: item.owner_id || "" });
    } else {
      setForm(defaultItem);
      setRules([]);
    }
  }, [item, open]);

  const handleAddRule = () => {
    setRules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "PASSIVO",
        title: "",
        description: "",
      },
    ]);
  };

  const handleUpdateRule = (id: string, field: keyof ItemRule, value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("Nome do item é obrigatório.");
      return;
    }

    let ownerName = form.owner || "";
    if (form.owner_type === "player" && form.owner_id) {
      const p = players.find((x) => x.id === form.owner_id);
      if (p) ownerName = p.character_name;
    } else if (form.owner_type === "npc" && form.owner_id) {
      const n = npcs.find((x) => x.id === form.owner_id);
      if (n) ownerName = n.name;
    } else if (!form.owner_type) {
      ownerName = "Ninguém";
    }

    const payload = {
      ...form,
      id: isEditing ? item.id : "it_" + crypto.randomUUID(),
      rules_bonus: rules,
      owner: ownerName,
      owner_type: form.owner_type || null,
      owner_id: form.owner_id || null,
    };
    onSave(payload);
    onOpenChange(false);
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUpload currentUrl={form.image_url || null} folder="items" onUpload={(url) => set("image_url", url)} onRemove={() => set("image_url", "")} className="w-full h-40" />
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} /></div>

            {/* Field Array / Repeater para Regras & Bônus */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> Regras & Efeitos Mecânicos (V5)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRule}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Regra
                </Button>
              </div>

              {rules.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded-lg text-center bg-muted/20">
                  <p className="text-xs text-muted-foreground">Nenhuma regra ou bônus mecânico adicionado.</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddRule}
                    className="mt-2 text-xs text-primary hover:text-primary"
                  >
                    + Criar primeira regra
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-surface-container-low border border-border/60 rounded-md space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Regra #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRule(rule.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          title="Remover Regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[11px]">Tipo (Tag)</Label>
                          <Select
                            value={rule.type}
                            onValueChange={(val) => handleUpdateRule(rule.id, "type", val as any)}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RULE_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[11px]">Nome da Regra</Label>
                          <Input
                            value={rule.title}
                            onChange={(e) => handleUpdateRule(rule.id, "title", e.target.value)}
                            placeholder="Ex: Imunidade Mágica"
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[11px]">Efeitos / Descrição</Label>
                        <Textarea
                          value={rule.description}
                          onChange={(e) => handleUpdateRule(rule.id, "description", e.target.value)}
                          placeholder="- Insira os efeitos em tópicos ou texto livre..."
                          rows={2}
                          className="text-xs bg-background min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Posse (tipo)</Label>
                <Select value={form.owner_type} onValueChange={(v) => { set("owner_type", v); set("owner_id", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Jogador</SelectItem>
                    <SelectItem value="npc">NPC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proprietário</Label>
                <Select value={form.owner_id} onValueChange={(v) => set("owner_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {form.owner_type === "player" && players.map((p) => <SelectItem key={p.id} value={p.id}>{p.character_name}</SelectItem>)}
                    {form.owner_type === "npc" && npcs.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(item.id); onOpenChange(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
