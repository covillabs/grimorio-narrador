import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const CATEGORIES = ["Arma", "Ferramenta de Investigação", "Artefato Místico", "Documento"];

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any;
  onDelete?: (id: string) => void;
  players: { id: string; character_name: string }[];
  npcs: { id: string; name: string }[];
}

const defaultItem = {
  name: "", category: "Artefato Místico", description: "", rules_bonus: "",
  owner_type: "" as string, owner_id: "" as string, image_url: "",
};

export function ItemDialog({ open, onOpenChange, item, onDelete, players, npcs }: ItemDialogProps) {
  const [form, setForm] = useState(defaultItem);
  const queryClient = useQueryClient();
  const isEditing = !!item;

  useEffect(() => {
    if (item) setForm({ ...defaultItem, ...item, owner_type: item.owner_type || "", owner_id: item.owner_id || "" });
    else setForm(defaultItem);
  }, [item, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        owner_type: data.owner_type || null,
        owner_id: data.owner_id || null,
      };
      if (isEditing) {
        const { error } = await supabase.from("items").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success(isEditing ? "Item atualizado." : "Item criado.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
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
            <div><Label>Regras / Bônus</Label><Textarea value={form.rules_bonus} onChange={(e) => set("rules_bonus", e.target.value)} rows={2} /></div>
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
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Salvando..." : "Salvar"}</Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
