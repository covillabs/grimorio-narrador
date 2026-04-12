import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MythDialog } from "@/components/MythDialog";
import { toast } from "sonner";

export default function OcultismoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMyth, setEditingMyth] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: myths = [], isLoading } = useQuery({
    queryKey: ["myths"],
    queryFn: async () => {
      const { data, error } = await supabase.from("myths").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: discoveries = [] } = useQuery({
    queryKey: ["myth_discoveries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("myth_discoveries").select("*, players(character_name)");
      if (error) throw error;
      return data;
    },
  });

  const deleteMyth = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("myths").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myths"] });
      toast.success("Mito removido.");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Ocultismo</h1>
          <p className="text-muted-foreground mt-1">Arquivo de mitos e lendas</p>
        </div>
        <Button onClick={() => { setEditingMyth(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Mito
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : myths.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhum mito registrado</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {myths.map((myth) => {
            const mythDiscoveries = discoveries.filter((d) => d.myth_id === myth.id);
            return (
              <AccordionItem key={myth.id} value={myth.id} className="bg-card border border-border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-semibold">{myth.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={(e) => { e.stopPropagation(); setEditingMyth(myth); setDialogOpen(true); }}
                    >
                      Editar
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-2">
                    {myth.mortal_vision && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">👁 Visão dos Mortais</h4>
                        <p className="text-sm">{myth.mortal_vision}</p>
                      </div>
                    )}
                    {myth.supernatural_vision && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-primary mb-1">🌙 Visão do Sobrenatural</h4>
                        <p className="text-sm">{myth.supernatural_vision}</p>
                      </div>
                    )}
                    {myth.hidden_truth && (
                      <div className="bg-muted/50 p-3 rounded-md border border-primary/20">
                        <h4 className="text-xs uppercase tracking-wider text-primary mb-1">🔮 A Verdade Oculta</h4>
                        <p className="text-sm italic">{myth.hidden_truth}</p>
                      </div>
                    )}
                    {mythDiscoveries.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Descoberto por</h4>
                        <div className="flex gap-1 flex-wrap">
                          {mythDiscoveries.map((d) => (
                            <Badge key={d.id} variant="secondary" className="text-xs">
                              {(d as any).players?.character_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <MythDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        myth={editingMyth}
        onDelete={(id) => deleteMyth.mutate(id)}
      />
    </div>
  );
}
