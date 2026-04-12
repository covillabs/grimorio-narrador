import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { HungerTracker } from "@/components/HungerTracker";
import { HumanityTracker } from "@/components/HumanityTracker";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: any;
  onDelete?: (id: string) => void;
}

const defaultPlayer = {
  character_name: "", player_name: "", clan: "", sire: "", generation: 13,
  hunger: 0, humanity: 7, health_max: 7, health_current: 7,
  willpower_max: 5, willpower_current: 5, human_history: "", embrace_story: "",
  disciplines: "", merits: "", flaws: "", image_url: "",
};

export function PlayerDialog({ open, onOpenChange, player, onDelete }: PlayerDialogProps) {
  const [form, setForm] = useState(defaultPlayer);
  const queryClient = useQueryClient();
  const isEditing = !!player;

  useEffect(() => {
    if (player) {
      setForm({ ...defaultPlayer, ...player });
    } else {
      setForm(defaultPlayer);
    }
  }, [player, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEditing) {
        const { error } = await supabase.from("players").update(data).eq("id", player.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("players").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success(isEditing ? "Personagem atualizado." : "Personagem criado.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? "Editar Personagem" : "Novo Personagem"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-6">
            <div className="flex gap-4">
              <ImageUpload
                currentUrl={form.image_url || null}
                folder="players"
                onUpload={(url) => set("image_url", url)}
                onRemove={() => set("image_url", "")}
                className="w-32 h-32 flex-shrink-0"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Nome do Personagem *</Label>
                  <Input value={form.character_name} onChange={(e) => set("character_name", e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome do Jogador</Label>
                    <Input value={form.player_name} onChange={(e) => set("player_name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Clã</Label>
                    <Input value={form.clan} onChange={(e) => set("clan", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Senhor (Sire)</Label>
                <Input value={form.sire} onChange={(e) => set("sire", e.target.value)} />
              </div>
              <div>
                <Label>Geração</Label>
                <Input type="number" value={form.generation} onChange={(e) => set("generation", parseInt(e.target.value) || 13)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-primary">Fome ({form.hunger}/5)</Label>
                <HungerTracker value={form.hunger} onChange={(v) => set("hunger", v)} />
              </div>
              <div>
                <Label className="text-gold">Humanidade ({form.humanity}/10)</Label>
                <HumanityTracker value={form.humanity} onChange={(v) => set("humanity", v)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vitalidade ({form.health_current}/{form.health_max})</Label>
                <div className="flex gap-2">
                  <Input type="number" value={form.health_current} onChange={(e) => set("health_current", parseInt(e.target.value) || 0)} />
                  <Input type="number" value={form.health_max} onChange={(e) => set("health_max", parseInt(e.target.value) || 7)} />
                </div>
              </div>
              <div>
                <Label>Força de Vontade ({form.willpower_current}/{form.willpower_max})</Label>
                <div className="flex gap-2">
                  <Input type="number" value={form.willpower_current} onChange={(e) => set("willpower_current", parseInt(e.target.value) || 0)} />
                  <Input type="number" value={form.willpower_max} onChange={(e) => set("willpower_max", parseInt(e.target.value) || 5)} />
                </div>
              </div>
            </div>

            <div>
              <Label>História Humana</Label>
              <Textarea value={form.human_history} onChange={(e) => set("human_history", e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Como foi o Abraço</Label>
              <Textarea value={form.embrace_story} onChange={(e) => set("embrace_story", e.target.value)} rows={3} />
            </div>
            <div>
              <Label>Disciplinas</Label>
              <Textarea value={form.disciplines} onChange={(e) => set("disciplines", e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vantagens</Label>
                <Textarea value={form.merits} onChange={(e) => set("merits", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Defeitos</Label>
                <Textarea value={form.flaws} onChange={(e) => set("flaws", e.target.value)} rows={2} />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(player.id); onOpenChange(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
