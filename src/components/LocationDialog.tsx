import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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

const TYPES = ["Santuário", "Zona de Guerra", "Elysium", "Refúgio", "Território"];

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: any;
  onDelete?: (id: string) => void;
}

const defaultLocation = {
  name: "", type: "Santuário", description_public: "", master_secrets: "",
  controller_npc_id: "" as string, image_url: "",
};

export function LocationDialog({ open, onOpenChange, location, onDelete }: LocationDialogProps) {
  const [form, setForm] = useState(defaultLocation);
  const queryClient = useQueryClient();
  const isEditing = !!location;

  const { data: npcs = [] } = useQuery({
    queryKey: ["npcs"],
    queryFn: async () => {
      const { data } = await supabase.from("npcs").select("id, name");
      return data || [];
    },
  });

  useEffect(() => {
    if (location) setForm({ ...defaultLocation, ...location, controller_npc_id: location.controller_npc_id || "" });
    else setForm(defaultLocation);
  }, [location, open]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = { ...data, controller_npc_id: data.controller_npc_id || null };
      if (isEditing) {
        const { error } = await supabase.from("locations").update(payload).eq("id", location.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("locations").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success(isEditing ? "Local atualizado." : "Local criado.");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar Local" : "Novo Local"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
            <ImageUpload currentUrl={form.image_url || null} folder="locations" onUpload={(url) => set("image_url", url)} onRemove={() => set("image_url", "")} className="w-full h-40" />
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Controlador (NPC)</Label>
              <Select value={form.controller_npc_id} onValueChange={(v) => set("controller_npc_id", v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  {npcs.map((n) => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição Pública</Label><Textarea value={form.description_public} onChange={(e) => set("description_public", e.target.value)} rows={3} /></div>
            <div><Label>Segredos do Mestre</Label><Textarea value={form.master_secrets} onChange={(e) => set("master_secrets", e.target.value)} rows={3} /></div>
            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(location.id); onOpenChange(false); }}>
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
