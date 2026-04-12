import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemDialog } from "@/components/ItemDialog";
import { toast } from "sonner";

const CATEGORIES = ["Arma", "Ferramenta de Investigação", "Artefato Místico", "Documento"];

export default function ArsenalPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data } = await supabase.from("players").select("id, character_name");
      return data || [];
    },
  });

  const { data: npcs = [] } = useQuery({
    queryKey: ["npcs"],
    queryFn: async () => {
      const { data } = await supabase.from("npcs").select("id, name");
      return data || [];
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item removido.");
    },
  });

  const filtered = items.filter((item) => categoryFilter === "all" || item.category === categoryFilter);

  const getOwnerName = (item: any) => {
    if (!item.owner_type || !item.owner_id) return null;
    if (item.owner_type === "player") {
      return players.find((p) => p.id === item.owner_id)?.character_name;
    }
    if (item.owner_type === "npc") {
      return npcs.find((n) => n.id === item.owner_id)?.name;
    }
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">Arsenal</h1>
          <p className="text-muted-foreground mt-1">Itens e artefatos da crônica</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Item
        </Button>
      </div>

      <div className="mb-6">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-serif">Nenhum item encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const ownerName = getOwnerName(item);
            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => { setEditingItem(item); setDialogOpen(true); }}
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-3xl opacity-30">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-semibold">{item.name}</h3>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  {ownerName && (
                    <p className="text-xs text-primary">Posse: {ownerName}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        onDelete={(id) => deleteItem.mutate(id)}
        players={players}
        npcs={npcs}
      />
    </div>
  );
}
