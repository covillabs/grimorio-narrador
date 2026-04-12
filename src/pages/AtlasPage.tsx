import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationDialog } from "@/components/LocationDialog";
import { toast } from "sonner";

export default function AtlasPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("*, npcs(name)").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Local removido.");
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Atlas Sombrio</h1>
          <p className="text-muted-foreground mt-1">Locais e territórios da crônica</p>
        </div>
        <Button onClick={() => { setEditingLocation(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Local
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhum local registrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => { setEditingLocation(loc); setDialogOpen(true); }}
            >
              <div className="aspect-video bg-muted overflow-hidden relative">
                {loc.image_url ? (
                  <img src={loc.image_url} alt={loc.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-3xl opacity-30">
                    {loc.name.charAt(0)}
                  </div>
                )}
                <Badge className="absolute top-2 right-2 text-xs" variant="secondary">{loc.type}</Badge>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-serif font-semibold">{loc.name}</h3>
                {(loc as any).npcs?.name && (
                  <p className="text-xs text-primary">Controlador: {(loc as any).npcs.name}</p>
                )}
                {loc.description_public && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{loc.description_public}</p>
                )}
                {loc.master_secrets && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
                      onClick={() => setShowSecrets((p) => ({ ...p, [loc.id]: !p[loc.id] }))}
                    >
                      {showSecrets[loc.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      Segredos do Mestre
                    </button>
                    {showSecrets[loc.id] && (
                      <p className="text-sm text-primary/80 mt-1 italic">{loc.master_secrets}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editingLocation}
        onDelete={(id) => deleteLocation.mutate(id)}
      />
    </div>
  );
}
