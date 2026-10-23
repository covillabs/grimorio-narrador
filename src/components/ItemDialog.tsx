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
import { generateUUID } from "@/lib/uuid";

const CATEGORIES = ["Arma", "Ferramenta de Investigação", "Artefato Místico", "Documento"];
const RULE_TYPES = ["PASSIVO", "REATIVO", "GATILHO", "AÇÃO", "BÔNUS"] as const;

export const TARGET_OPTIONS = [
  {
    group: "Paradas Principais",
    options: [
      { label: "Combate (Geral)", value: "combate" },
      { label: "Parada Física", value: "fisico" },
      { label: "Parada Social", value: "social" },
      { label: "Parada Mental", value: "mental" },
    ],
  },
  {
    group: "Atributos Físicos",
    options: [
      { label: "Força", value: "forca" },
      { label: "Destreza", value: "destreza" },
      { label: "Vigor", value: "vigor" },
    ],
  },
  {
    group: "Atributos Sociais",
    options: [
      { label: "Carisma", value: "carisma" },
      { label: "Manipulação", value: "manipulacao" },
      { label: "Compostura", value: "compostura" },
    ],
  },
  {
    group: "Atributos Mentais",
    options: [
      { label: "Inteligência", value: "inteligencia" },
      { label: "Raciocínio", value: "raciocinio" },
      { label: "Perseverança", value: "perseveranca" },
    ],
  },
  {
    group: "Perícias",
    options: [
      { label: "Briga", value: "briga" },
      { label: "Armas de Fogo", value: "armas_de_fogo" },
      { label: "Armas Brancas", value: "armas_brancas" },
      { label: "Furtividade", value: "furtividade" },
      { label: "Percepção", value: "percepcao" },
      { label: "Investigação", value: "investigacao" },
      { label: "Atletismo", value: "atletismo" },
    ],
  },
  {
    group: "Combate & Status",
    options: [
      { label: "Dano Físico (+Bônus)", value: "dano_fisico" },
      { label: "Dano Agravado", value: "dano_agravado" },
      { label: "Defesa (Esquiva)", value: "defesa" },
      { label: "Vitalidade Máxima", value: "vitalidade" },
      { label: "Força de Vontade Máxima", value: "vontade" },
    ],
  },
];

export interface ItemModifier {
  id: string;
  target: string;
  value: number;
  isConditional: boolean;
  conditionKey?: string;
}

export interface ItemRule {
  id: string;
  type: typeof RULE_TYPES[number];
  title: string;
  description: string;
  modifiers?: ItemModifier[];
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
            id: generateUUID(),
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
        id: generateUUID(),
        type: "PASSIVO",
        title: "",
        description: "",
        modifiers: [],
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

  const handleAddModifier = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const currentMods = r.modifiers || [];
        return {
          ...r,
          modifiers: [
            ...currentMods,
            {
              id: generateUUID(),
              target: "Combate",
              value: 1,
              isConditional: false,
              conditionKey: "",
            },
          ],
        };
      })
    );
  };

  const handleUpdateModifier = (
    ruleId: string,
    modId: string,
    field: keyof ItemModifier,
    value: any
  ) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        const currentMods = r.modifiers || [];
        return {
          ...r,
          modifiers: currentMods.map((m) =>
            m.id === modId ? { ...m, [field]: value } : m
          ),
        };
      })
    );
  };

  const handleRemoveModifier = (ruleId: string, modId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          modifiers: (r.modifiers || []).filter((m) => m.id !== modId),
        };
      })
    );
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
      id: isEditing ? item.id : "it_" + generateUUID(),
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

                      {/* Subformulário: Modificadores Mecânicos (Dice Pool & Atributos) */}
                      <div className="pt-2 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Plus className="w-3 h-3 text-primary" /> Modificadores Mecânicos (+/-)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddModifier(rule.id)}
                            className="h-6 text-[10px] text-primary hover:text-primary gap-1 px-2"
                          >
                            + Modificador
                          </Button>
                        </div>

                        {rule.modifiers && rule.modifiers.length > 0 && (
                          <div className="space-y-2 bg-background/50 p-2 rounded border border-border/40">
                            {rule.modifiers.map((mod) => (
                              <div key={mod.id} className="space-y-2 p-2 bg-muted/20 rounded border border-border/30">
                                <div className="grid grid-cols-5 gap-2 items-center">
                                  <div className="col-span-2">
                                    <Label className="text-[10px]">Alvo</Label>
                                    <Select
                                      value={mod.target || (mod as any).alvo || "combate"}
                                      onValueChange={(v) => {
                                        handleUpdateModifier(rule.id, mod.id, "target", v);
                                        handleUpdateModifier(rule.id, mod.id, "alvo" as any, v);
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-[11px] bg-background">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-48">
                                        {TARGET_OPTIONS.map((grp) => (
                                          <div key={grp.group}>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 bg-muted/30">
                                              {grp.group}
                                            </div>
                                            {grp.options.map((opt) => (
                                              <SelectItem key={opt.value} value={opt.value} className="text-xs pl-4">
                                                {opt.label}
                                              </SelectItem>
                                            ))}
                                          </div>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label className="text-[10px]">Valor (+/-)</Label>
                                    <Input
                                      type="number"
                                      value={mod.value !== undefined ? mod.value : (mod as any).valor || 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        handleUpdateModifier(rule.id, mod.id, "value", val);
                                        handleUpdateModifier(rule.id, mod.id, "valor" as any, val);
                                      }}
                                      className="h-7 text-xs bg-background text-center font-mono"
                                    />
                                  </div>

                                  <div className="col-span-2 flex items-center justify-between pt-3 pl-1">
                                    <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={mod.isConditional}
                                        onChange={(e) => handleUpdateModifier(rule.id, mod.id, "isConditional", e.target.checked)}
                                        className="rounded text-primary focus:ring-0"
                                      />
                                      Condicional
                                    </label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveModifier(rule.id, mod.id)}
                                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      title="Excluir modificador"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {mod.isConditional && (
                                  <div>
                                    <Label className="text-[10px]">Gatilho / Nome da Condição</Label>
                                    <Input
                                      value={mod.conditionKey || ""}
                                      onChange={(e) => handleUpdateModifier(rule.id, mod.id, "conditionKey", e.target.value)}
                                      placeholder="Ex: furia_fria_ativa ou Lua Cheia"
                                      className="h-7 text-xs bg-background"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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
