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

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: any;
  onDelete?: (id: string) => void;
}

const defaultSession = { title: "", session_date: new Date().toISOString().split("T")[0], summary: "", notes: "" };

export function SessionDialog({ open, onOpenChange, session, onDelete }: SessionDialogProps) {
  const [form, setForm] = useState(defaultSession);
  const queryClient = useQueryClient();
  const isEditing = !!session;

  useEffect(() => {
    if (session) setForm({ ...defaultSession, ...session });
    else setForm({ ...defaultSession, session_date: new Date().toISOString().split("T")[0] });
  }, [session, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEditing) {
        const { error } = await supabase.from("sessions").update(data).eq("id", session.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sessions").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(isEditing ? "Sessão atualizada." : "Sessão criada.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar Sessão" : "Nova Sessão"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
            <div><Label>Data</Label><Input type="date" value={form.session_date} onChange={(e) => set("session_date", e.target.value)} /></div>
            <div><Label>Resumo</Label><Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={4} placeholder="O que aconteceu nesta sessão..." /></div>
            <div><Label>Anotações Rápidas</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Notas do narrador..." /></div>
            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(session.id); onOpenChange(false); }}>
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
