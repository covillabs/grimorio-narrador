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
import { Trash2, Plus, Sparkles, Award } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface NpcSpecialty {
  id: string;
  pericia: string;
  foco: string;
}

export interface NpcDiscipline {
  id: string;
  name: string;
  level: number;
  powers: string;
}

interface NpcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  npc?: any;
  onDelete?: (id: string) => void;
  onSave?: (data: any) => void;
}

const CATEGORY_OPTIONS = [
  "Camarilla",
  "Sabá",
  "Anarquistas",
  "Independentes",
  "Humanos",
  "Carniçais",
  "Lupinos",
  "Outro"
];

const ROLE_OPTIONS = [
  "Nenhum",
  "Príncipe / Arcebispo",
  "Senescal",
  "Primogênito",
  "Xerife / Templário",
  "Harpia",
  "Algoz / Carrasco",
  "Guardião do Elysium",
  "Barão",
  "Membro Comum",
  "Sangue Fraco",
];

const defaultNpc = {
  name: "", category: "Camarilla", role: "Nenhum", clan: "", status: "Vivo" as const,
  appearance: "", history: "", motivations: "", master_secrets: "",
  physical_pool: 4, social_pool: 4, mental_pool: 4,
  blood_potency: 0, health: 7, image_url: "",
  species_faction: "",
};

export function NpcDialog({ open, onOpenChange, npc, onDelete, onSave }: NpcDialogProps) {
  const [form, setForm] = useState(defaultNpc);
  const [specialties, setSpecialties] = useState<NpcSpecialty[]>([]);
  const [disciplines, setDisciplines] = useState<NpcDiscipline[]>([]);

  const queryClient = useQueryClient();
  const isEditing = !!npc;

  useEffect(() => {
    if (npc) {
      // Parsing de Especialidades
      let parsedSpecialties: NpcSpecialty[] = [];
      if (Array.isArray(npc.specialties)) {
        parsedSpecialties = npc.specialties;
      } else if (typeof npc.specialties === "string" && npc.specialties.trim()) {
        try {
          const json = JSON.parse(npc.specialties);
          if (Array.isArray(json)) parsedSpecialties = json;
          else throw new Error();
        } catch {
          parsedSpecialties = npc.specialties.split(",").map((s: string) => {
            const match = s.match(/(.*?)\((.*?)\)/);
            if (match) {
              return { id: crypto.randomUUID(), pericia: match[1].trim(), foco: match[2].trim() };
            }
            return { id: crypto.randomUUID(), pericia: s.trim(), foco: "" };
          });
        }
      }
      setSpecialties(parsedSpecialties);

      // Parsing de Disciplinas
      let parsedDisciplines: NpcDiscipline[] = [];
      if (Array.isArray(npc.disciplines)) {
        parsedDisciplines = npc.disciplines;
      } else if (typeof npc.disciplines === "string" && npc.disciplines.trim()) {
        try {
          const json = JSON.parse(npc.disciplines);
          if (Array.isArray(json)) parsedDisciplines = json;
          else throw new Error();
        } catch {
          parsedDisciplines = [{
            id: crypto.randomUUID(),
            name: "Disciplinas",
            level: 1,
            powers: npc.disciplines
          }];
        }
      }
      setDisciplines(parsedDisciplines);

      setForm({ ...defaultNpc, ...npc });
    } else {
      setForm(defaultNpc);
      setSpecialties([]);
      setDisciplines([]);
    }
  }, [npc, open]);

  // Handlers para Especialidades
  const handleAddSpecialty = () => {
    setSpecialties((prev) => [
      ...prev,
      { id: crypto.randomUUID(), pericia: "", foco: "" }
    ]);
  };

  const handleUpdateSpecialty = (id: string, field: keyof NpcSpecialty, value: string) => {
    setSpecialties((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveSpecialty = (id: string) => {
    setSpecialties((prev) => prev.filter((s) => s.id !== id));
  };

  // Handlers para Disciplinas
  const handleAddDiscipline = () => {
    setDisciplines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", level: 1, powers: "" }
    ]);
  };

  const handleUpdateDiscipline = (id: string, field: keyof NpcDiscipline, value: any) => {
    setDisciplines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleRemoveDiscipline = (id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        specialties,
        disciplines,
      };

      if (onSave) {
        onSave(payload);
        return;
      }

      if (isEditing) {
        const { error } = await supabase.from("npcs").update(payload).eq("id", npc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("npcs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      if (!onSave) {
        queryClient.invalidateQueries({ queryKey: ["npcs"] });
        toast.success(isEditing ? "NPC atualizado." : "NPC criado.");
        onOpenChange(false);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-serif">{isEditing ? "Editar NPC" : "Novo NPC"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-6">
            <div className="flex gap-4">
              <ImageUpload currentUrl={form.image_url || null} folder="npcs" onUpload={(url) => set("image_url", url)} onRemove={() => set("image_url", "")} className="w-24 h-24 flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
                  </div>
                  <div>
                    <Label>Categoria / Seita</Label>
                    <Select value={form.category || "Camarilla"} onValueChange={(v) => set("category", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Label>Cargo / Título</Label>
                    <Select value={form.role || "Nenhum"} onValueChange={(v) => set("role", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                <div>
                  <Label>Detalhes (Ex: Raça, Alcunha, Faccão Específica)</Label>
                  <Input value={form.species_faction} onChange={(e) => set("species_faction", e.target.value)} placeholder="Ex: Criança da Noite, Algoz de Prince..." />
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

            {/* Atributos de Combate e Paradas */}
            <div className="border-t border-border pt-4 space-y-4">
              <h4 className="font-serif text-sm font-semibold text-primary">Combate e Paradas de Dados</h4>
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Físico</Label><Input type="number" value={form.physical_pool} onChange={(e) => set("physical_pool", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Social</Label><Input type="number" value={form.social_pool} onChange={(e) => set("social_pool", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Mental</Label><Input type="number" value={form.mental_pool} onChange={(e) => set("mental_pool", parseInt(e.target.value) || 0)} /></div>
                <div><Label>Vitalidade</Label><Input type="number" value={form.health} onChange={(e) => set("health", parseInt(e.target.value) || 0)} /></div>
              </div>
              <div>
                <Label>Potência de Sangue</Label>
                <Input type="number" value={form.blood_potency} onChange={(e) => set("blood_potency", parseInt(e.target.value) || 0)} className="w-1/2" />
              </div>
            </div>

            {/* Field Array: Especialidades */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" /> Especialidades (Perícias & Foco)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSpecialty}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Especialidade
                </Button>
              </div>

              {specialties.length === 0 ? (
                <div className="p-3 border border-dashed border-border rounded-lg text-center bg-muted/10">
                  <p className="text-xs text-muted-foreground">Nenhuma especialidade registrada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {specialties.map((spec, index) => (
                    <div key={spec.id} className="flex items-center gap-2 p-2 bg-surface-container-low border border-border/50 rounded-md">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Perícia (ex: Armas de Fogo)"
                          value={spec.pericia}
                          onChange={(e) => handleUpdateSpecialty(spec.id, "pericia", e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          placeholder="Foco (ex: Tiro em Movimento)"
                          value={spec.foco}
                          onChange={(e) => handleUpdateSpecialty(spec.id, "foco", e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSpecialty(spec.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Field Array: Disciplinas / Trunfos */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> Disciplinas & Trunfos
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDiscipline}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Disciplina
                </Button>
              </div>

              {disciplines.length === 0 ? (
                <div className="p-3 border border-dashed border-border rounded-lg text-center bg-muted/10">
                  <p className="text-xs text-muted-foreground">Nenhuma disciplina cadastrada.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disciplines.map((disc, index) => (
                    <div key={disc.id} className="p-3 bg-surface-container-low border border-border/60 rounded-md space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Label className="text-[10px]">Nome (ex: Dominação)</Label>
                            <Input
                              placeholder="Nome da disciplina"
                              value={disc.name}
                              onChange={(e) => handleUpdateDiscipline(disc.id, "name", e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Nível</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={disc.level}
                              onChange={(e) => handleUpdateDiscipline(disc.id, "level", parseInt(e.target.value) || 1)}
                              className="h-8 text-xs bg-background"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDiscipline(disc.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive mt-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-[10px]">Poderes / Efeitos Adquiridos</Label>
                        <Textarea
                          placeholder="Ex: Aura de Ruptura Absoluta, Espelho d'Alma..."
                          value={disc.powers}
                          onChange={(e) => handleUpdateDiscipline(disc.id, "powers", e.target.value)}
                          rows={2}
                          className="text-xs bg-background min-h-[50px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
