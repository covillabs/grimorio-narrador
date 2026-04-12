import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionDialog } from "@/components/SessionDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function DiarioPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").order("session_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Sessão removida.");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Diário da Crônica</h1>
          <p className="text-muted-foreground mt-1">Registro de sessões e acontecimentos</p>
        </div>
        <Button onClick={() => { setEditingSession(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Sessão
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhuma sessão registrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-card border border-border rounded-lg p-5 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => { setEditingSession(session); setDialogOpen(true); }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-serif font-semibold text-lg">{session.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>
              {session.summary && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{session.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <SessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        session={editingSession}
        onDelete={(id) => deleteSession.mutate(id)}
      />
    </div>
  );
}
