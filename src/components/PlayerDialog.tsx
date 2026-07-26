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
import { Trash2, Plus, Sparkles, Award, BookOpen, ShieldAlert, Heart, Zap } from "lucide-react";
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

// Lista das 27 Perícias Oficiais do Vampiro: A Máscara 5ª Edição
export const V5_SKILLS_LIST = {
  fisicas: [
    { key: "atletismo", label: "Atletismo" },
    { key: "briga", label: "Briga" },
    { key: "conducao", label: "Condução" },
    { key: "armas_fogo", label: "Armas de Fogo" },
    { key: "furtividade", label: "Furtividade" },
    { key: "armas_brancas", label: "Armas Brancas" },
    { key: "oficios", label: "Ofícios" },
    { key: "sobrevivencia", label: "Sobrevivência" },
    { key: "ladragem", label: "Ladragem" },
  ],
  sociais: [
    { key: "empatia", label: "Empatia" },
    { key: "expressao", label: "Expressão" },
    { key: "intimidacao", label: "Intimidação" },
    { key: "lideranca", label: "Liderança" },
    { key: "manha", label: "Manha" },
    { key: "labia", label: "Lábia" },
    { key: "performance", label: "Performance" },
    { key: "persuasao", label: "Persuasão" },
    { key: "trato_animais", label: "Trato c/ Animais" },
  ],
  mentais: [
    { key: "ciencias", label: "Ciências" },
    { key: "erudicao", label: "Erudição" },
    { key: "financas", label: "Finanças" },
    { key: "investigacao", label: "Investigação" },
    { key: "medicina", label: "Medicina" },
    { key: "ocultismo", label: "Ocultismo" },
    { key: "tecnologia", label: "Tecnologia" },
    { key: "percepcao", label: "Percepção" },
    { key: "politica", label: "Política" },
  ],
};

const defaultPlayer = {
  character_name: "", player_name: "", clan: "", sire: "", generation: 13,
  hunger: 0, humanity: 7,
  // 9 Atributos Oficiais V5 (Padrão 1 a 5)
  forca: 1, destreza: 1, vigor: 1,
  carisma: 1, manipulacao: 1, compostura: 1,
  inteligencia: 1, raciocinio: 1, perseveranca: 1,
  // Dano e Gasto de Vontade
  sup_dmg: 0, agr_dmg: 0, fw_sup: 0, fw_agr: 0,
  skills: {} as Record<string, number>,
  human_history: "", embrace_story: "", image_url: "",
};

// Componente Interativo de Bolinhas (Dots)
function DotRating({
  value,
  min = 0,
  max = 5,
  onChange,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  size?: "sm" | "md";
}) {
  const dotSize = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => {
        const dotVal = i + 1;
        const isActive = dotVal <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (value === dotVal && dotVal > min) {
                onChange(dotVal - 1);
              } else {
                onChange(Math.max(min, dotVal));
              }
            }}
            className={`${dotSize} rounded-full border border-border transition-all ${
              isActive
                ? "bg-blood shadow-[0_0_5px_hsl(var(--blood)/0.6)] border-blood"
                : "bg-muted/40 hover:bg-muted"
            }`}
          />
        );
      })}
    </div>
  );
}

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

      setForm({
        ...defaultPlayer,
        ...player,
        skills: player.skills && typeof player.skills === "object" ? player.skills : {},
      });
    } else {
      setForm(defaultPlayer);
      setDisciplines([]);
      setMerits([]);
      setFlaws([]);
    }
  }, [player, open]);

  // Cálculos Automáticos Oficiais V5
  const calculatedHealthMax = (form.vigor || 1) + 3;
  const calculatedWillpowerMax = (form.compostura || 1) + (form.perseveranca || 1);

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
    if (!form.character_name || !form.character_name.trim()) {
      toast.error("Nome do personagem é obrigatório.");
      return;
    }

    const playerData = {
      ...form,
      character_name: form.character_name.trim(),
      id: isEditing ? player.id : crypto.randomUUID(),
      // Automações V5
      health_max: calculatedHealthMax,
      willpower_max: calculatedWillpowerMax,
      health_current: Math.max(0, calculatedHealthMax - (form.sup_dmg || 0) - (form.agr_dmg || 0)),
      willpower_current: Math.max(0, calculatedWillpowerMax - (form.fw_sup || 0) - (form.fw_agr || 0)),
      // Arrays JSONB
      disciplines,
      merits,
      flaws,
    };

    onSave(playerData);
    onOpenChange(false);
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const setSkill = (skillKey: string, value: number) => {
    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [skillKey]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader className="pb-2 border-b border-border/40">
          <DialogTitle className="font-serif text-xl">
            {isEditing ? "Editar Personagem" : "Novo Personagem"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh] pr-4 pt-2">
          <form onSubmit={handleSubmit} className="space-y-6 pt-1 pb-4">
            {/* Bloco do Topo sem clipping: Imagem + Nome + Jogador + Clã */}
            <div className="flex flex-col sm:flex-row gap-4 items-start bg-muted/10 p-3 rounded-lg border border-border/40">
              <ImageUpload
                currentUrl={form.image_url || null}
                folder="players"
                onUpload={(url) => set("image_url", url)}
                onRemove={() => set("image_url", "")}
                className="w-32 h-32 flex-shrink-0 rounded-md overflow-hidden"
              />
              <div className="flex-1 w-full space-y-3">
                <div>
                  <Label className="text-xs font-bold text-foreground">Nome do Personagem *</Label>
                  <Input
                    value={form.character_name}
                    onChange={(e) => set("character_name", e.target.value)}
                    placeholder="Ex: Gabriel Vane"
                    required
                    className="mt-1 bg-background"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nome do Jogador</Label>
                    <Input
                      value={form.player_name}
                      onChange={(e) => set("player_name", e.target.value)}
                      placeholder="Ex: Lucas"
                      className="mt-1 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Clã</Label>
                    <Input
                      value={form.clan}
                      onChange={(e) => set("clan", e.target.value)}
                      placeholder="Ex: Ventrue"
                      className="mt-1 bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Senhor (Sire)</Label>
                <Input value={form.sire || ""} onChange={(e) => set("sire", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Geração</Label>
                <Input type="number" value={form.generation || 13} onChange={(e) => set("generation", parseInt(e.target.value) || 13)} className="h-8 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-muted/10 p-3 rounded-lg border border-border/40">
              <div>
                <Label className="text-xs font-semibold text-primary">Fome ({form.hunger}/5)</Label>
                <HungerTracker value={form.hunger} onChange={(v) => set("hunger", v)} />
              </div>
              <div>
                <Label className="text-xs font-semibold text-amber-400">Humanidade ({form.humanity}/10)</Label>
                <HumanityTracker value={form.humanity} onChange={(v) => set("humanity", v)} />
              </div>
            </div>

            {/* Seção 1: Atributos V5 (9 Atributos Oficiais) */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5 font-serif text-primary">
                  <Sparkles className="w-4 h-4" /> Atributos (V5)
                </Label>
                <span className="text-[11px] text-muted-foreground italic">1 a 5 pontos</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/10 p-3 rounded-lg border border-border/40">
                {/* Físicos */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-blood uppercase tracking-wider block border-b border-blood/20 pb-1">
                    Físicos
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Força</Label>
                      <DotRating value={form.forca || 1} min={1} onChange={(v) => set("forca", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Destreza</Label>
                      <DotRating value={form.destreza || 1} min={1} onChange={(v) => set("destreza", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Vigor</Label>
                      <DotRating value={form.vigor || 1} min={1} onChange={(v) => set("vigor", v)} />
                    </div>
                  </div>
                </div>

                {/* Sociais */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block border-b border-amber-400/20 pb-1">
                    Sociais
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Carisma</Label>
                      <DotRating value={form.carisma || 1} min={1} onChange={(v) => set("carisma", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Manipulação</Label>
                      <DotRating value={form.manipulacao || 1} min={1} onChange={(v) => set("manipulacao", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Compostura</Label>
                      <DotRating value={form.compostura || 1} min={1} onChange={(v) => set("compostura", v)} />
                    </div>
                  </div>
                </div>

                {/* Mentais */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block border-b border-blue-400/20 pb-1">
                    Mentais
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Inteligência</Label>
                      <DotRating value={form.inteligencia || 1} min={1} onChange={(v) => set("inteligencia", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Raciocínio</Label>
                      <DotRating value={form.raciocinio || 1} min={1} onChange={(v) => set("raciocinio", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Perseverança</Label>
                      <DotRating value={form.perseveranca || 1} min={1} onChange={(v) => set("perseveranca", v)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 3: Automação de Status V5 (Vitalidade e Vontade Calculadas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-4">
              {/* Vitalidade (Vigor + 3) */}
              <div className="bg-muted/10 p-3 rounded-lg border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-blood flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> Vitalidade (Máx: {calculatedHealthMax})
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    (Vigor {form.vigor || 1} + 3)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Dano Superficial</Label>
                    <Input
                      type="number"
                      min={0}
                      max={calculatedHealthMax}
                      value={form.sup_dmg || 0}
                      onChange={(e) => set("sup_dmg", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Dano Agravado</Label>
                    <Input
                      type="number"
                      min={0}
                      max={calculatedHealthMax}
                      value={form.agr_dmg || 0}
                      onChange={(e) => set("agr_dmg", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Força de Vontade (Compostura + Perseverança) */}
              <div className="bg-muted/10 p-3 rounded-lg border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-blue-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Vontade (Máx: {calculatedWillpowerMax})
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    (Comp {form.compostura || 1} + Pers {form.perseveranca || 1})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Vontade Gasta / Sup</Label>
                    <Input
                      type="number"
                      min={0}
                      max={calculatedWillpowerMax}
                      value={form.fw_sup || 0}
                      onChange={(e) => set("fw_sup", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Dano Agravado WP</Label>
                    <Input
                      type="number"
                      min={0}
                      max={calculatedWillpowerMax}
                      value={form.fw_agr || 0}
                      onChange={(e) => set("fw_agr", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Perícias V5 (Accordion com 27 Perícias Oficiais) */}
            <div className="border-t border-border/60 pt-4">
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg px-3 bg-muted/10">
                <AccordionItem value="skills" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-serif text-primary">
                      <Award className="w-4 h-4" /> Perícias Oficiais V5 (27 Perícias)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Físicas */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-blood uppercase tracking-wider block border-b border-blood/20 pb-1">
                          Físicas
                        </span>
                        {V5_SKILLS_LIST.fisicas.map((s) => (
                          <div key={s.key} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{s.label}</span>
                            <DotRating
                              value={(form.skills && form.skills[s.key]) || 0}
                              min={0}
                              size="sm"
                              onChange={(v) => setSkill(s.key, v)}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Sociais */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block border-b border-amber-400/20 pb-1">
                          Sociais
                        </span>
                        {V5_SKILLS_LIST.sociais.map((s) => (
                          <div key={s.key} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{s.label}</span>
                            <DotRating
                              value={(form.skills && form.skills[s.key]) || 0}
                              min={0}
                              size="sm"
                              onChange={(v) => setSkill(s.key, v)}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Mentais */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block border-b border-blue-400/20 pb-1">
                          Mentais
                        </span>
                        {V5_SKILLS_LIST.mentais.map((s) => (
                          <div key={s.key} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{s.label}</span>
                            <DotRating
                              value={(form.skills && form.skills[s.key]) || 0}
                              min={0}
                              size="sm"
                              onChange={(v) => setSkill(s.key, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
