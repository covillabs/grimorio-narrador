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

interface NpcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  npc?: any;
  onDelete?: (id: string) => void;
}

const defaultNpc = {
  name: "", species_faction: "", clan: "", status: "Vivo" as const,
  appearance: "", history: "", motivations: "", master_secrets: "",
  physical_pool: 4, social_pool: 4, mental_pool: 4, specialties: "",
  blood_potency: 0, disciplines: "", health: 7, image_url: "",
};

export function NpcDialog({ open, onOpenChange, npc, onDelete }: NpcDialogProps) {
  const [form, setForm] = useState(defaultNpc);
  const queryClient = useQueryClient();
  const isEditing = !!npc;

  useEffect(() => {
    if (npc) setForm({ ...defaultNpc, ...npc });
    else setForm(defaultNpc);
  }, [npc, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEditing) {
        const { error } = await supabase.from("npcs").update(data).eq("id", npc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("npcs").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["npcs"] });
      toast.success(isEditing ? "NPC atualizado." : "NPC criado.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar NPC" : "Novo NPC"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-6">
            <div className="flex gap-4">
              <ImageUpload currentUrl={form.image_url || null} folder="npcs" onUpload={(url) => set("image_url", url)} onRemove={() => set("image_url", "")} className="w-24 h-24 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Espécie/Facção</Label>
                    <Input value={form.species_faction} onChange={(e) => set("species_faction", e.target.value)} />
                  </div>
                  <div>
                    <Label>Clã</Label>
                    <Input value={form.clan} onChange={(e) => set("clan", e.target.value)} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vivo">Vivo</SelectItem>
                        <SelectItem value="Morte Final">Morte Final</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Aparência / Maneirismos</Label>
              <Textarea value={form.appearance} onChange={(e) => set("appearance", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Histórico</Label>
              <Textarea value={form.history} onChange={(e) => set("history", e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Motivações</Label>
              <Textarea value={form.motivations} onChange={(e) => set("motivations", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Segredos do Mestre</Label>
              <Textarea value={form.master_secrets} onChange={(e) => set("master_secrets", e.target.value)} rows={2} />
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="font-serif text-sm font-semibold mb-3 text-primary">Combate</h4>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Físico</Label><Input type="number" value={form.physical_pool} onChange={(e) => set("physical_pool", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Social</Label><Input type="number" value={form.social_pool} onChange={(e) => set("social_pool", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Mental</Label><Input type="number" value={form.mental_pool} onChange={(e) => set("mental_pool", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Vitalidade</Label><Input type="number" value={form.health} onChange={(e) => set("health", parseInt(e.target.value) || 0)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><Label>Potência de Sangue</Label><Input type="number" value={form.blood_potency} onChange={(e) => set("blood_potency", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Especialidades</Label><Input value={form.specialties} onChange={(e) => set("specialties", e.target.value)} /></div>
              </div>
              <div className="mt-3">
                <Label>Disciplinas</Label>
                <Textarea value={form.disciplines} onChange={(e) => set("disciplines", e.target.value)} rows={2} />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(npc.id); onOpenChange(false); }}>
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
