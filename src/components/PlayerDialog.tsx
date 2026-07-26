import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { HungerTracker } from "@/components/HungerTracker";
import { HumanityTracker } from "@/components/HumanityTracker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Plus, Sparkles, Award, BookOpen, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface PlayerDiscipline {
  id: string;
  nome: string;
  nivel: number;
}

export interface PlayerMeritFlaw {
  id: string;
  nome: string;
  pontos: number;
}

interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: any;
  onDelete?: (id: string) => void;
  onSave: (player: any) => void;
}

const defaultPlayer = {
  character_name: "", player_name: "", clan: "", sire: "", generation: 13,
  hunger: 0, humanity: 7, health_max: 7, health_current: 7,
  willpower_max: 5, willpower_current: 5, human_history: "", embrace_story: "",
  image_url: "",
};

export function PlayerDialog({ open, onOpenChange, player, onDelete, onSave }: PlayerDialogProps) {
  const [form, setForm] = useState(defaultPlayer);
  const [disciplines, setDisciplines] = useState<PlayerDiscipline[]>([]);
  const [merits, setMerits] = useState<PlayerMeritFlaw[]>([]);
  const [flaws, setFlaws] = useState<PlayerMeritFlaw[]>([]);

  const isEditing = !!player;

  useEffect(() => {
    if (player) {
      // 1. Parsing de Disciplinas
      let parsedDisciplines: PlayerDiscipline[] = [];
      if (Array.isArray(player.disciplines)) {
        parsedDisciplines = player.disciplines;
      } else if (typeof player.disciplines === "string" && player.disciplines.trim()) {
        try {
          const json = JSON.parse(player.disciplines);
          if (Array.isArray(json)) parsedDisciplines = json;
          else throw new Error();
        } catch {
          parsedDisciplines = player.disciplines.split(",").map((s: string) => ({
            id: crypto.randomUUID(),
            nome: s.trim(),
            nivel: 1,
          }));
        }
      }
      setDisciplines(parsedDisciplines);

      // 2. Parsing de Vantagens (Merits)
      let parsedMerits: PlayerMeritFlaw[] = [];
      if (Array.isArray(player.merits)) {
        parsedMerits = player.merits;
      } else if (typeof player.merits === "string" && player.merits.trim()) {
        try {
          const json = JSON.parse(player.merits);
          if (Array.isArray(json)) parsedMerits = json;
          else throw new Error();
        } catch {
          parsedMerits = player.merits.split(",").map((s: string) => ({
            id: crypto.randomUUID(),
            nome: s.trim(),
            pontos: 1,
          }));
        }
      }
      setMerits(parsedMerits);

      // 3. Parsing de Defeitos (Flaws)
      let parsedFlaws: PlayerMeritFlaw[] = [];
      if (Array.isArray(player.flaws)) {
        parsedFlaws = player.flaws;
      } else if (typeof player.flaws === "string" && player.flaws.trim()) {
        try {
          const json = JSON.parse(player.flaws);
          if (Array.isArray(json)) parsedFlaws = json;
          else throw new Error();
        } catch {
          parsedFlaws = player.flaws.split(",").map((s: string) => ({
            id: crypto.randomUUID(),
            nome: s.trim(),
            pontos: 1,
          }));
        }
      }
      setFlaws(parsedFlaws);

      setForm({ ...defaultPlayer, ...player });
    } else {
      setForm(defaultPlayer);
      setDisciplines([]);
      setMerits([]);
      setFlaws([]);
    }
  }, [player, open]);

  // Handlers Disciplinas
  const handleAddDiscipline = () => {
    setDisciplines((prev) => [...prev, { id: crypto.randomUUID(), nome: "", nivel: 1 }]);
  };

  const handleUpdateDiscipline = (id: string, field: keyof PlayerDiscipline, value: any) => {
    setDisciplines((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleRemoveDiscipline = (id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  // Handlers Vantagens
  const handleAddMerit = () => {
    setMerits((prev) => [...prev, { id: crypto.randomUUID(), nome: "", pontos: 1 }]);
  };

  const handleUpdateMerit = (id: string, field: keyof PlayerMeritFlaw, value: any) => {
    setMerits((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleRemoveMerit = (id: string) => {
    setMerits((prev) => prev.filter((m) => m.id !== id));
  };

  // Handlers Defeitos
  const handleAddFlaw = () => {
    setFlaws((prev) => [...prev, { id: crypto.randomUUID(), nome: "", pontos: 1 }]);
  };

  const handleUpdateFlaw = (id: string, field: keyof PlayerMeritFlaw, value: any) => {
    setFlaws((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleRemoveFlaw = (id: string) => {
    setFlaws((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.character_name) {
      toast.error("Nome do personagem é obrigatório.");
      return;
    }

    const playerData = {
      ...form,
      id: isEditing ? player.id : crypto.randomUUID(),
      disciplines, // Enviado como JSONB array
      merits,      // Enviado como JSONB array
      flaws,       // Enviado como JSONB array
    };

    onSave(playerData);
    onOpenChange(false);
  };

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
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label className="text-primary font-semibold">Fome ({form.hunger}/5)</Label>
                <HungerTracker value={form.hunger} onChange={(v) => set("hunger", v)} />
              </div>
              <div>
                <Label className="font-semibold text-amber-400">Humanidade ({form.humanity}/10)</Label>
                <HumanityTracker value={form.humanity} onChange={(v) => set("humanity", v)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vitalidade ({form.health_current}/{form.health_max})</Label>
                <div className="flex gap-2">
                  <Input type="number" value={form.health_current} onChange={(e) => set("health_current", parseInt(e.target.value) || 0)} placeholder="Atual" />
                  <Input type="number" value={form.health_max} onChange={(e) => set("health_max", parseInt(e.target.value) || 7)} placeholder="Máx" />
                </div>
              </div>
              <div>
                <Label>Força de Vontade ({form.willpower_current}/{form.willpower_max})</Label>
                <div className="flex gap-2">
                  <Input type="number" value={form.willpower_current} onChange={(e) => set("willpower_current", parseInt(e.target.value) || 0)} placeholder="Atual" />
                  <Input type="number" value={form.willpower_max} onChange={(e) => set("willpower_max", parseInt(e.target.value) || 5)} placeholder="Máx" />
                </div>
              </div>
            </div>

            {/* Field Array: Disciplinas */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> Disciplinas Vampíricas
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
                <div className="space-y-2">
                  {disciplines.map((disc) => (
                    <div key={disc.id} className="flex items-center gap-2 p-2 bg-surface-container-low border border-border/50 rounded-md">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input
                            placeholder="Nome da Disciplina (ex: Fortitude)"
                            value={disc.nome}
                            onChange={(e) => handleUpdateDiscipline(disc.id, "nome", e.target.value)}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <div>
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            placeholder="Nível (1-5)"
                            value={disc.nivel}
                            onChange={(e) => handleUpdateDiscipline(disc.id, "nivel", parseInt(e.target.value) || 1)}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDiscipline(disc.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Remover Disciplina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Field Array: Vantagens e Defeitos (Side-by-Side) */}
            <div className="border-t border-border/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vantagens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1 text-emerald-400">
                    <Award className="w-3.5 h-3.5" /> Vantagens (Merits)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMerit}
                    className="h-7 text-[11px] px-2 gap-1"
                  >
                    <Plus className="w-3 h-3" /> Vantagem
                  </Button>
                </div>

                {merits.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">Nenhuma vantagem registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {merits.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 p-1.5 bg-surface-container-low border border-border/40 rounded">
                        <Input
                          placeholder="Nome da Vantagem"
                          value={m.nome}
                          onChange={(e) => handleUpdateMerit(m.id, "nome", e.target.value)}
                          className="h-7 text-xs bg-background flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={m.pontos}
                          onChange={(e) => handleUpdateMerit(m.id, "pontos", parseInt(e.target.value) || 1)}
                          className="h-7 text-xs bg-background w-14 text-center"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMerit(m.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Defeitos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1 text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" /> Defeitos (Flaws)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddFlaw}
                    className="h-7 text-[11px] px-2 gap-1"
                  >
                    <Plus className="w-3 h-3" /> Defeito
                  </Button>
                </div>

                {flaws.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">Nenhum defeito registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {flaws.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 p-1.5 bg-surface-container-low border border-border/40 rounded">
                        <Input
                          placeholder="Nome do Defeito"
                          value={f.nome}
                          onChange={(e) => handleUpdateFlaw(f.id, "nome", e.target.value)}
                          className="h-7 text-xs bg-background flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={f.pontos}
                          onChange={(e) => handleUpdateFlaw(f.id, "pontos", parseInt(e.target.value) || 1)}
                          className="h-7 text-xs bg-background w-14 text-center"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFlaw(f.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Accordion de Lore: Background e História (Fechado por Padrão) */}
            <div className="border-t border-border/60 pt-4">
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg px-3 bg-muted/10">
                <AccordionItem value="history" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-serif text-primary">
                      <BookOpen className="w-4 h-4" /> Background e História (Lore)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div>
                      <Label className="text-xs">História Humana</Label>
                      <Textarea
                        value={form.human_history}
                        onChange={(e) => set("human_history", e.target.value)}
                        placeholder="Descreva a vida mortal do personagem..."
                        rows={3}
                        className="text-xs bg-background mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Como foi o Abraço</Label>
                      <Textarea
                        value={form.embrace_story}
                        onChange={(e) => set("embrace_story", e.target.value)}
                        placeholder="Relate as circunstâncias do Abraço..."
                        rows={3}
                        className="text-xs bg-background mt-1"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="flex justify-between pt-4">
              {isEditing && onDelete ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(player.id); onOpenChange(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
