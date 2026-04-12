import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MythDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myth?: any;
  onDelete?: (id: string) => void;
}

const defaultMyth = { title: "", mortal_vision: "", supernatural_vision: "", hidden_truth: "" };

export function MythDialog({ open, onOpenChange, myth, onDelete }: MythDialogProps) {
  const [form, setForm] = useState(defaultMyth);
  const queryClient = useQueryClient();
  const isEditing = !!myth;

  useEffect(() => {
    if (myth) setForm({ ...defaultMyth, ...myth });
    else setForm(defaultMyth);
  }, [myth, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEditing) {
        const { error } = await supabase.from("myths").update(data).eq("id", myth.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("myths").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myths"] });
      toast.success(isEditing ? "Mito atualizado." : "Mito criado.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar Mito" : "Novo Mito"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
            <div><Label>Título da Lenda *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
            <div>
              <Label>👁 Visão dos Mortais</Label>
              <Textarea value={form.mortal_vision} onChange={(e) => set("mortal_vision", e.target.value)} rows={3} placeholder="O que os mortais acreditam sobre este mito..." />
            </div>
            <div>
              <Label>🌙 Visão do Sobrenatural</Label>
              <Textarea value={form.supernatural_vision} onChange={(e) => set("supernatural_vision", e.target.value)} rows={3} placeholder="O que os seres sobrenaturais sabem..." />
            </div>
            <div>
              <Label>🔮 A Verdade Oculta</Label>
              <Textarea value={form.hidden_truth} onChange={(e) => set("hidden_truth", e.target.value)} rows={3} placeholder="A verdade que somente o narrador conhece..." />
            </div>
            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(myth.id); onOpenChange(false); }}>
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
