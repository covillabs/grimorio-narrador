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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Sparkles, Award, BookOpen, ShieldAlert, Heart, Zap, ShieldCheck, Flame, Layers, Skull, Calculator } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface PlayerDiscipline {
  id: string;
  nome: string;
  nivel: number;
  poderes: string[];
}

export interface PlayerAdvantage {
  id: string;
  nome: string;
  tipo: "Vantagem" | "Defeito" | "Antecedente";
  pontos: number;
}

export interface XPLogItem {
  id: string;
  motivo: string;
  custo: number;
}

interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: any;
  onDelete?: (id: string) => void;
  onSave: (player: any) => void;
}

export interface V5ClanInfo {
  name: string;
  disciplines: string[];
  bane: string;
}

// Mapeamento Completo dos 15 Clãs Oficiais do V5 com Disciplinas e Banes (Fraquezas)
export const V5_CLANS_DATA: Record<string, V5ClanInfo> = {
  Brujah: {
    name: "Brujah",
    disciplines: ["Potência", "Rapidez", "Presença"],
    bane: "Fúria Violenta: O Brujah sofre uma penalidade em rolagens para resistir ao Frenesi de Fúria.",
  },
  Gangrel: {
    name: "Gangrel",
    disciplines: ["Animalismo", "Fortitude", "Metamorfose"],
    bane: "Estigma Bestial: Ao entrar em Frenesi, o Gangrel ganha características animais temporárias.",
  },
  Malkavian: {
    name: "Malkavian",
    disciplines: ["Auspícios", "Dominação", "Ofuscação"],
    bane: "Mandarim da Loucura: O Malkavian carrega uma Perturbação incurável que se intensifica com a Fome.",
  },
  Nosferatu: {
    name: "Nosferatu",
    disciplines: ["Animalismo", "Ofuscação", "Potência"],
    bane: "Deformidade Hedionda: A aparência monstruosa impede disfarces comuns e penaliza interações sociais humanas.",
  },
  Toreador: {
    name: "Toreador",
    disciplines: ["Auspícios", "Presença", "Rapidez"],
    bane: "Fascínio Estético: O Toreador se torna paralisado de fascínio ao testemunhar beleza suprema.",
  },
  Tremere: {
    name: "Tremere",
    disciplines: ["Auspícios", "Dominação", "Feitiçaria de Sangue"],
    bane: "Laço Destruído: O Sangue Tremere é incapaz de criar laços de sangue totais com outros vampiros.",
  },
  Ventrue: {
    name: "Ventrue",
    disciplines: ["Dominação", "Fortitude", "Presença"],
    bane: "Paladar Refinado: O Ventrue só consegue se alimentar de um tipo específico e restrito de sangue mortal.",
  },
  "Banu Haqim": {
    name: "Banu Haqim",
    disciplines: ["Auspícios", "Feitiçaria de Sangue", "Rapidez"],
    bane: "Vício em Vitae: O Banu Haqim sente uma sede incontrolável pelo sangue de outros vampiros.",
  },
  Lasombra: {
    name: "Lasombra",
    disciplines: ["Dominação", "Oblívio", "Potência"],
    bane: "Distorção de Imagem: O Lasombra não produz reflexos claros em espelhos e distorce gravações de vídeo.",
  },
  Ministério: {
    name: "Ministério",
    disciplines: ["Metamorfose", "Ofuscação", "Presença"],
    bane: "Aversão à Luz: O Ministério sofre dano e penalidades intensificadas quando exposto a luzes fortes.",
  },
  Hecata: {
    name: "Hecata",
    disciplines: ["Auspícios", "Fortitude", "Oblívio"],
    bane: "Beijo Doloroso: O Beijo do Hecata causa uma dor agonizante indescritível à vítima.",
  },
  Ravnos: {
    name: "Ravnos",
    disciplines: ["Animalismo", "Ofuscação", "Presença"],
    bane: "Espírito Nômade: O Ravnos sofre danos se dormir no mesmo local na mesma semana.",
  },
  Tzimisce: {
    name: "Tzimisce",
    disciplines: ["Animalismo", "Dominação", "Metamorfose"],
    bane: "Propriedade Sagrada: O Tzimisce deve dormir cercado por terra de seu local de nascimento.",
  },
  "Sangue-Fraco": {
    name: "Sangue-Fraco",
    disciplines: ["Alquimia Sangue-Fraco"],
    bane: "Sangue Diluído: Não possui disciplinas inerentes e sofre fraquezas fatais de mortais.",
  },
  Caitiff: {
    name: "Caitiff",
    disciplines: ["Auspícios", "Fortitude", "Potência"],
    bane: "Sem Clã: O Caitiff sofre rejeição social generalizada entre os Membros da sociedade vampírica.",
  },
};

// Lista Oficial das 12 Disciplinas do V5
export const V5_OFFICIAL_DISCIPLINES = [
  "Animalismo",
  "Auspícios",
  "Rapidez",
  "Fortitude",
  "Potência",
  "Presença",
  "Metamorfose",
  "Ofuscação",
  "Dominação",
  "Feitiçaria de Sangue",
  "Oblívio",
  "Alquimia Sangue-Fraco",
] as const;

// Mapeamento Completo de Poderes Oficiais do V5 por Disciplina e Nível
export const V5_DISCIPLINE_POWERS: Record<string, Record<number, string[]>> = {
  Animalismo: {
    1: ["Sussurros dos Animais", "Acalmar a Besta"],
    2: ["Familiar Vampírico"],
    3: ["Dominar a Besta", "Sucção Animal"],
    4: ["Comandar Pragas", "Subjugar o Espírito"],
    5: ["Expulsão do Sangue", "Comunhão Bestial"],
  },
  Auspícios: {
    1: ["Sentidos Aguçados", "Premonição"],
    2: ["Visão da Aura", "Revelação Mística"],
    3: ["Toque Psíquico", "Sintonar a Mente"],
    4: ["Telepatia", "Possuição Distante"],
    5: ["Projeção Psíquica", "Onisciência"],
  },
  Rapidez: {
    1: ["Reflexos de Gato", "Fração de Segundo"],
    2: ["Movimento Rápido", "Esquiva Celerada"],
    3: ["Passo de Ilusão", "Velocidade Relâmpago"],
    4: ["Aceleração Temporal"],
    5: ["Fantasmas de Sangue", "Ataque Múltiplo"],
  },
  Fortitude: {
    1: ["Resistência Mística", "Mente Inviolável"],
    2: ["Resiliência", "Endurecimento"],
    3: ["Defesas de Aço", "Armadura Defensiva"],
    4: ["Desviar Vulnerabilidade"],
    5: ["Pele de Titã", "Imunidade Divina"],
  },
  Potência: {
    1: ["Corpo Letal", "Salto Prodigioso"],
    2: ["Prowess (Vigor Físico)", "Empurrão Esmagador"],
    3: ["Impacto Brutal", "Esmagar Barricada"],
    4: ["Terremoto"],
    5: ["Punho do Titã", "Onda de Choque"],
  },
  Presença: {
    1: ["Fascínio (Awe)", "Pavor (Daunt)"],
    2: ["Olhar Fixador", "Voz Magistral"],
    3: ["Entrincheiramento", "Magnetismo Irresistível"],
    4: ["Majestade"],
    5: ["Encantamento em Massa", "Convocação Primordial"],
  },
  Metamorfose: {
    1: ["Olhos do Predador", "Forma Bestial (Gavras)"],
    2: ["Fusão com a Terra"],
    3: ["Metamorfose Selvagem (Lobo/Morcego)"],
    4: ["Forma de Névoa"],
    5: ["Lorde das Feras", "Metamorfose Monstruosa"],
  },
  Ofuscação: {
    1: ["Manto de Sombras", "Silêncio Mortal"],
    2: ["Passar sem Deixar Rastro"],
    3: ["Máscara dos Mil Faces", "Desaparecimento"],
    4: ["Ocultar o Grupo"],
    5: ["Mão Invencível", "Disfarce Absoluto"],
  },
  Dominação: {
    1: ["Comando", "Mesmerismo"],
    2: ["Amnésia", "Hipnose rápida"],
    3: ["Racionalização", "Gravar Sugestão"],
    4: ["Possuição Comercial"],
    5: ["Decreto Final", "Reescrever Memória"],
  },
  "Feitiçaria de Sangue": {
    1: ["Boca de Sangue", "Gosto pelo Sangue"],
    2: ["Escudo de Sangue", "Extrato Venenoso"],
    3: ["Toque Corrosivo", "Sangue Fervilhante"],
    4: ["Caldeirão do Sangue"],
    5: ["Destruição de Laço", "Roubo de Vitae"],
  },
  Oblívio: {
    1: ["Manto de Sombras Abissais", "Testemunha dos Mortos"],
    2: ["Projeção de Sombras"],
    3: ["Toque da Podridão", "Invocar Aparição"],
    4: ["Névoa Sombria"],
    5: ["Portal das Sombras", "Avatar do Abismo"],
  },
  "Alquimia Sangue-Fraco": {
    1: ["Fórmula de Calcinação 1"],
    2: ["Fórmula de Destilação 2"],
    3: ["Mito de Sangue 3"],
    4: ["Elixir da Noite 4"],
    5: ["Gênese Sangrenta 5"],
  },
};

// Lista das 27 Perícias Oficiais V5
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

// Limites Oficiais de Potência de Sangue por Geração (V5)
export function getV5BloodPotencyLimits(generation: number) {
  const gen = Number(generation) || 13;
  if (gen >= 14) return { min: 0, max: 0 };
  if (gen >= 12) return { min: 1, max: 3 };
  if (gen >= 10) return { min: 1, max: 4 };
  if (gen === 9 || gen === 8) return { min: 2, max: 5 };
  if (gen === 7) return { min: 3, max: 6 };
  if (gen === 6) return { min: 4, max: 7 };
  if (gen === 5) return { min: 5, max: 8 };
  if (gen <= 4) return { min: 6, max: 9 };
  return { min: 0, max: 10 };
}

// Calculadora Automática de Custos Oficiais do V5 para a Ficha
export function calculateV5SheetXPSpent(
  form: any,
  disciplines: PlayerDiscipline[],
  advantages: PlayerAdvantage[]
): number {
  let totalSpent = 0;

  // 1. Atributos (Custos V5: Nível x 5 XP para avanços acima de 1)
  const attributes = [
    form.forca, form.destreza, form.vigor,
    form.carisma, form.manipulacao, form.compostura,
    form.inteligencia, form.raciocinio, form.perseveranca,
  ];

  attributes.forEach((attrVal) => {
    const val = Number(attrVal) || 1;
    for (let lvl = 2; lvl <= val; lvl++) {
      totalSpent += lvl * 5;
    }
  });

  // 2. Perícias (Nível x 3 XP) + Especializações (3 XP cada)
  if (form.skills && typeof form.skills === "object") {
    Object.values(form.skills).forEach((sData: any) => {
      let nivel = 0;
      let spec = "";
      if (typeof sData === "number") nivel = sData;
      else if (sData && typeof sData === "object") {
        nivel = sData.nivel || 0;
        spec = sData.especializacao || "";
      }

      for (let lvl = 1; lvl <= nivel; lvl++) {
        totalSpent += lvl * 3;
      }
      if (spec && spec.trim()) {
        totalSpent += 3;
      }
    });
  }

  // 3. Disciplinas (Nível x 5 XP se de clã, Nível x 7 se fora do clã)
  const clanInfo = V5_CLANS_DATA[form.clan];
  const clanDiscSet = new Set((clanInfo?.disciplines || []).map((d) => d.toLowerCase()));

  disciplines.forEach((d) => {
    const isClan = clanDiscSet.has((d.nome || "").toLowerCase());
    const multiplier = isClan ? 5 : 7;
    for (let lvl = 1; lvl <= (d.nivel || 1); lvl++) {
      totalSpent += lvl * multiplier;
    }
  });

  // 4. Vantagens e Antecedentes (3 XP por ponto)
  advantages.forEach((adv) => {
    if (adv.tipo === "Vantagem" || adv.tipo === "Antecedente") {
      totalSpent += (adv.pontos || 1) * 3;
    }
  });

  return totalSpent;
}

const defaultPlayer = {
  character_name: "", player_name: "", clan: "Ventrue", sire: "", generation: 13,
  hunger: 0, humanity: 7, stains: 0, blood_potency: 1,
  xp_total: 0, clan_bane: "",
  forca: 1, destreza: 1, vigor: 1,
  carisma: 1, manipulacao: 1, compostura: 1,
  inteligencia: 1, raciocinio: 1, perseveranca: 1,
  sup_dmg: 0, agr_dmg: 0, fw_sup: 0, fw_agr: 0,
  skills: {} as Record<string, { nivel: number; especializacao: string[] }>,
  human_history: "", embrace_story: "", image_url: "",
};

// Componente Modular de Cálculo de Efeitos Passivos V5
export function calculateV5PassiveEffects(
  disciplines: PlayerDiscipline[],
  vigor: number,
  compostura: number,
  perseveranca: number
) {
  let healthMaxBonus = 0;
  let willpowerMaxBonus = 0;
  const activePassives: string[] = [];

  disciplines.forEach((d) => {
    const normName = (d.nome || "").trim();
    const powers = d.poderes || [];

    if (normName.toLowerCase() === "fortitude") {
      const hasResilience = powers.some(
        (p) =>
          p &&
          (p.toLowerCase().includes("resiliência") ||
            p.toLowerCase().includes("resiliencia"))
      );
      if (hasResilience) {
        const bonus = d.nivel || 1;
        healthMaxBonus += bonus;
        activePassives.push(`Fortitude (Resiliência): +${bonus} Vitalidade`);
      }
    }
  });

  return {
    health_max: (vigor || 1) + 3 + healthMaxBonus,
    willpower_max: (compostura || 1) + (perseveranca || 1) + willpowerMaxBonus,
    healthMaxBonus,
    willpowerMaxBonus,
    activePassives,
  };
}

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
  const [advantages, setAdvantages] = useState<PlayerAdvantage[]>([]);
  const [xpLog, setXpLog] = useState<XPLogItem[]>([]);

  const isEditing = !!player;

  useEffect(() => {
    if (player) {
      // 1. Parsing de Disciplinas com Estrutura de Poderes
      let parsedDisciplines: PlayerDiscipline[] = [];
      if (Array.isArray(player.disciplines)) {
        parsedDisciplines = player.disciplines.map((d: any) => ({
          id: d.id || crypto.randomUUID(),
          nome: d.nome || d.name || "Fortitude",
          nivel: d.nivel || d.level || 1,
          poderes: Array.isArray(d.poderes)
            ? d.poderes
            : Array.from({ length: d.nivel || 1 }, () => ""),
        }));
      }
      setDisciplines(parsedDisciplines);

      // 2. Parsing Unificado de Vantagens, Defeitos e Antecedentes
      let parsedAdvantages: PlayerAdvantage[] = [];
      if (Array.isArray(player.advantages)) {
        parsedAdvantages = player.advantages;
      } else {
        if (Array.isArray(player.merits)) {
          player.merits.forEach((m: any) => {
            parsedAdvantages.push({ id: m.id || crypto.randomUUID(), nome: m.nome, tipo: "Vantagem", pontos: m.pontos || 1 });
          });
        }
        if (Array.isArray(player.flaws)) {
          player.flaws.forEach((f: any) => {
            parsedAdvantages.push({ id: f.id || crypto.randomUUID(), nome: f.nome, tipo: "Defeito", pontos: f.pontos || 1 });
          });
        }
      }
      setAdvantages(parsedAdvantages);

      // 3. Parsing do Registro de Gastos de XP
      let parsedXpLog: XPLogItem[] = [];
      if (Array.isArray(player.xp_log)) {
        parsedXpLog = player.xp_log;
      }
      setXpLog(parsedXpLog);

      setForm({
        ...defaultPlayer,
        ...player,
        clan: player.clan || "Ventrue",
        clan_bane: player.clan_bane || (V5_CLANS_DATA[player.clan]?.bane || V5_CLANS_DATA["Ventrue"].bane),
        skills: player.skills && typeof player.skills === "object" ? player.skills : {},
      });
    } else {
      const defaultClan = "Ventrue";
      const clanInfo = V5_CLANS_DATA[defaultClan];
      setForm({
        ...defaultPlayer,
        clan: defaultClan,
        clan_bane: clanInfo?.bane || "",
      });
      if (clanInfo) {
        setDisciplines(
          clanInfo.disciplines.map((dName) => ({
            id: crypto.randomUUID(),
            nome: dName,
            nivel: 1,
            poderes: [""],
          }))
        );
      } else {
        setDisciplines([]);
      }
      setAdvantages([]);
      setXpLog([]);
    }
  }, [player, open]);

  // Handler de Seleção de Clã com Automação de Disciplinas e Bane
  const handleClanChange = (newClan: string) => {
    const clanInfo = V5_CLANS_DATA[newClan];
    const baneText = clanInfo ? clanInfo.bane : "";

    setForm((prev) => ({
      ...prev,
      clan: newClan,
      clan_bane: baneText,
    }));

    if (clanInfo && clanInfo.disciplines.length > 0) {
      const autoDisciplines: PlayerDiscipline[] = clanInfo.disciplines.map((dName) => ({
        id: crypto.randomUUID(),
        nome: dName,
        nivel: 1,
        poderes: [""],
      }));
      setDisciplines(autoDisciplines);
      toast.info(`Disciplinas atualizadas para o Clã ${newClan}: ${clanInfo.disciplines.join(", ")}`);
    }
  };

  // Automações de Potência de Sangue e Status
  const bpLimits = getV5BloodPotencyLimits(form.generation || 13);
  const passiveEffects = calculateV5PassiveEffects(
    disciplines,
    form.vigor || 1,
    form.compostura || 1,
    form.perseveranca || 1
  );

  const calculatedHealthMax = passiveEffects.health_max;
  const calculatedWillpowerMax = passiveEffects.willpower_max;

  // Automação Reativa de XP Gasto e Disponível
  const manualLogXPSpent = xpLog.reduce((acc, item) => acc + (Number(item.custo) || 0), 0);
  const autoCalculatedSheetXPSpent = calculateV5SheetXPSpent(form, disciplines, advantages);
  
  // XP Gasto Final (Soma do Log Manual + Custo Automático da Ficha)
  const calculatedXPSpent = manualLogXPSpent + autoCalculatedSheetXPSpent;
  const xpAvailable = Math.max(0, (form.xp_total || 0) - calculatedXPSpent);

  const handleGenerationChange = (gen: number) => {
    const lim = getV5BloodPotencyLimits(gen);
    const clampedBp = Math.max(lim.min, Math.min(lim.max, form.blood_potency || lim.min));
    setForm((prev) => ({ ...prev, generation: gen, blood_potency: clampedBp }));
  };

  // Helper para Perícias + Especializações
  const getSkillData = (key: string) => {
    const raw = form.skills?.[key];
    if (typeof raw === "number") return { nivel: raw, especializacao: "" };
    if (raw && typeof raw === "object") {
      const spec = Array.isArray(raw.especializacao) ? raw.especializacao.join(", ") : raw.especializacao || "";
      return { nivel: raw.nivel || 0, especializacao: spec };
    }
    return { nivel: 0, especializacao: "" };
  };

  const setSkillNivel = (key: string, nivel: number) => {
    const current = getSkillData(key);
    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [key]: { nivel, especializacao: current.especializacao },
      },
    }));
  };

  const setSkillSpec = (key: string, especializacao: string) => {
    const current = getSkillData(key);
    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [key]: { nivel: current.nivel, especializacao },
      },
    }));
  };

  // Handlers de Disciplinas
  const handleAddDiscipline = () => {
    setDisciplines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "Fortitude", nivel: 1, poderes: [""] },
    ]);
  };

  const handleUpdateDisciplineName = (id: string, newNome: string) => {
    setDisciplines((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const newPoderes = Array.from({ length: d.nivel }, () => "");
        return { ...d, nome: newNome, poderes: newPoderes };
      })
    );
  };

  const handleUpdateDisciplineNivel = (id: string, newNivel: number) => {
    const clamped = Math.max(1, Math.min(5, newNivel));
    setDisciplines((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const currentPoderes = d.poderes || [];
        const newPoderes = Array.from({ length: clamped }, (_, i) => currentPoderes[i] || "");
        return { ...d, nivel: clamped, poderes: newPoderes };
      })
    );
  };

  const handleUpdateDisciplinePower = (id: string, powerIdx: number, val: string) => {
    setDisciplines((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updatedPoderes = [...(d.poderes || [])];
        updatedPoderes[powerIdx] = val;
        return { ...d, poderes: updatedPoderes };
      })
    );
  };

  const handleRemoveDiscipline = (id: string) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  // Handlers Vantagens/Defeitos/Antecedentes
  const handleAddAdvantage = () => {
    setAdvantages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", tipo: "Vantagem", pontos: 1 },
    ]);
  };

  const handleUpdateAdvantage = (id: string, field: keyof PlayerAdvantage, value: any) => {
    setAdvantages((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleRemoveAdvantage = (id: string) => {
    setAdvantages((prev) => prev.filter((a) => a.id !== id));
  };

  // Handlers de Registro de XP
  const handleAddXPLogItem = () => {
    setXpLog((prev) => [
      ...prev,
      { id: crypto.randomUUID(), motivo: "Evolução / Poder", custo: 5 },
    ]);
  };

  const handleUpdateXPLogItem = (id: string, field: keyof XPLogItem, value: any) => {
    setXpLog((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveXPLogItem = (id: string) => {
    setXpLog((prev) => prev.filter((item) => item.id !== id));
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
      health_max: calculatedHealthMax,
      willpower_max: calculatedWillpowerMax,
      health_current: Math.max(0, calculatedHealthMax - (form.sup_dmg || 0) - (form.agr_dmg || 0)),
      willpower_current: Math.max(0, calculatedWillpowerMax - (form.fw_sup || 0) - (form.fw_agr || 0)),
      xp_spent: calculatedXPSpent,
      disciplines,
      advantages,
      xp_log: xpLog,
    };

    onSave(playerData);
    onOpenChange(false);
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

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
            {/* Topo: Imagem + Nome + Jogador + Clã Oficial V5 */}
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
                    <Label className="text-xs font-bold text-blood">Clã Oficial (V5) *</Label>
                    <Select
                      value={form.clan || "Ventrue"}
                      onValueChange={handleClanChange}
                    >
                      <SelectTrigger className="mt-1 bg-background font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {Object.keys(V5_CLANS_DATA).map((clanKey) => (
                          <SelectItem key={clanKey} value={clanKey} className="text-xs">
                            {clanKey}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Bane / Fraqueza do Clã (Gerado Automaticamente) */}
            {form.clan_bane && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg flex items-start gap-2">
                <Skull className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                    Bane (Fraqueza do Clã {form.clan}):
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {form.clan_bane}
                  </p>
                </div>
              </div>
            )}

            {/* Senhor, Geração e Potência de Sangue Reativa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/10 p-3 rounded-lg border border-border/40">
              <div>
                <Label className="text-xs">Senhor (Sire)</Label>
                <Input value={form.sire || ""} onChange={(e) => set("sire", e.target.value)} className="h-8 text-xs bg-background mt-1" />
              </div>
              <div>
                <Label className="text-xs">Geração ({form.generation || 13}ª)</Label>
                <Input
                  type="number"
                  min={4}
                  max={16}
                  value={form.generation || 13}
                  onChange={(e) => handleGenerationChange(parseInt(e.target.value) || 13)}
                  className="h-8 text-xs bg-background mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-blood flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Potência de Sangue
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    (Min: {bpLimits.min}, Máx: {bpLimits.max})
                  </span>
                </div>
                <div className="mt-2">
                  <DotRating
                    value={form.blood_potency || bpLimits.min}
                    min={bpLimits.min}
                    max={10}
                    onChange={(v) => {
                      const clamped = Math.max(bpLimits.min, Math.min(bpLimits.max, v));
                      set("blood_potency", clamped);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Fome, Humanidade, Manchas (Stains) e XP Reativo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10 p-3 rounded-lg border border-border/40">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-primary">Fome ({form.hunger}/5)</Label>
                    <HungerTracker value={form.hunger} onChange={(v) => set("hunger", v)} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-amber-400">Humanidade ({form.humanity}/10)</Label>
                    <HumanityTracker value={form.humanity} onChange={(v) => set("humanity", v)} />
                  </div>
                </div>

                {/* Trilha de Manchas (Stains V5) */}
                <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                  <Label className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Manchas / Stains ({form.stains || 0}/10)
                  </Label>
                  <DotRating
                    value={form.stains || 0}
                    min={0}
                    max={10}
                    size="sm"
                    onChange={(v) => set("stains", v)}
                  />
                </div>
              </div>

              {/* Experiência (XP Total Manual, XP Gasto Reativo e XP Disponível) */}
              <div className="space-y-2 border-l border-border/40 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Gestão de XP (V5)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Auto-calculado
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] font-bold">XP Total *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.xp_total || 0}
                      onChange={(e) => set("xp_total", parseInt(e.target.value) || 0)}
                      className="h-7 text-xs bg-background font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">XP Gasto</Label>
                    <div className="h-7 text-xs bg-muted/30 border border-border rounded flex items-center justify-center font-bold font-mono text-rose-400">
                      {calculatedXPSpent} XP
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">XP Disponível</Label>
                    <div className="h-7 text-xs bg-emerald-950/20 border border-emerald-500/40 rounded flex items-center justify-center font-bold font-mono text-emerald-400">
                      {xpAvailable} XP
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground italic flex items-center gap-1 pt-0.5">
                  <Calculator className="w-3 h-3 text-primary" /> Ficha ({autoCalculatedSheetXPSpent} XP) + Log Manual ({manualLogXPSpent} XP)
                </div>
              </div>
            </div>

            {/* Accordion de Registros Adicionais de Gastos de XP */}
            <div className="border-t border-border/60 pt-4">
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg px-3 bg-muted/10">
                <AccordionItem value="xp_log" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                    <span className="flex items-center gap-2 font-serif text-primary">
                      <Calculator className="w-4 h-4" /> Registro Manual de Gastos de XP ({xpLog.length})
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Adicione evoluções narrativas ou rituais adquiridos com XP.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddXPLogItem}
                        className="h-7 text-[11px] px-2 gap-1"
                      >
                        <Plus className="w-3 h-3" /> Registrar Gasto
                      </Button>
                    </div>

                    {xpLog.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">Nenhum gasto extra registrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {xpLog.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-1.5 bg-background border border-border/40 rounded">
                            <Input
                              placeholder="Motivo (ex: Aprendizado de Ritual de Nível 2)"
                              value={item.motivo}
                              onChange={(e) => handleUpdateXPLogItem(item.id, "motivo", e.target.value)}
                              className="h-7 text-xs flex-1"
                            />
                            <div className="flex items-center gap-1 w-24">
                              <Input
                                type="number"
                                min={0}
                                value={item.custo}
                                onChange={(e) => handleUpdateXPLogItem(item.id, "custo", parseInt(e.target.value) || 0)}
                                className="h-7 text-xs text-center font-bold text-rose-400"
                              />
                              <span className="text-[10px] text-muted-foreground">XP</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveXPLogItem(item.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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

            {/* Automação de Status V5 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-4">
              {/* Vitalidade */}
              <div className="bg-muted/10 p-3 rounded-lg border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-blood flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> Vitalidade (Máx: {calculatedHealthMax})
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    (Vigor {form.vigor || 1} + 3 {passiveEffects.healthMaxBonus > 0 ? `+ ${passiveEffects.healthMaxBonus} Fortitude` : ""})
                  </span>
                </div>
                {passiveEffects.activePassives.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {passiveEffects.activePassives.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> {p}
                      </div>
                    ))}
                  </div>
                )}
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

              {/* Força de Vontade */}
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

            {/* Field Array: Disciplinas Oficiais V5 */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5 font-serif text-primary">
                  <Sparkles className="w-4 h-4" /> Disciplinas & Poderes Vampíricos (V5)
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
                  {disciplines.map((disc) => {
                    const normDiscName = V5_OFFICIAL_DISCIPLINES.find(
                      (k) => k.toLowerCase() === (disc.nome || "").toLowerCase()
                    ) || disc.nome || "Fortitude";

                    const officialPowersMap = V5_DISCIPLINE_POWERS[normDiscName] || {};

                    return (
                      <div key={disc.id} className="p-3 bg-surface-container-low border border-border/50 rounded-md space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="text-[10px] text-muted-foreground">Disciplina Oficial V5</Label>
                            <Select
                              value={normDiscName}
                              onValueChange={(val) => handleUpdateDisciplineName(disc.id, val)}
                            >
                              <SelectTrigger className="h-8 text-xs bg-background font-semibold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-48">
                                {V5_OFFICIAL_DISCIPLINES.map((dName) => (
                                  <SelectItem key={dName} value={dName} className="text-xs">
                                    {dName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-[10px] text-muted-foreground block mb-1">Nível ({disc.nivel})</Label>
                            <DotRating
                              value={disc.nivel}
                              min={1}
                              max={5}
                              onChange={(v) => handleUpdateDisciplineNivel(disc.id, v)}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDiscipline(disc.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive self-end"
                            title="Remover Disciplina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Selects em Cascata de Poderes */}
                        <div className="pl-3 border-l-2 border-primary/30 space-y-2 pt-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                            Poderes Selecionados ({disc.nivel} Níveis)
                          </span>
                          {Array.from({ length: disc.nivel }, (_, levelIdx) => {
                            const lvl = levelIdx + 1;
                            const powerValue = (disc.poderes && disc.poderes[levelIdx]) || "";
                            const availablePowersForLevel = officialPowersMap[lvl] || [];

                            return (
                              <div key={levelIdx} className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-mono w-14">
                                  Nível {lvl}:
                                </span>
                                <Select
                                  value={powerValue}
                                  onValueChange={(v) => handleUpdateDisciplinePower(disc.id, levelIdx, v)}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-background flex-1">
                                    <SelectValue placeholder={`Selecionar Poder Nível ${lvl}...`} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-40">
                                    {availablePowersForLevel.length > 0 ? (
                                      availablePowersForLevel.map((pName) => (
                                        <SelectItem key={pName} value={pName} className="text-xs">
                                          {pName}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="Poder Genérico" className="text-xs">
                                        Poder de Nível {lvl}
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Seção 2: Perícias V5 + Especializações */}
            <div className="border-t border-border/60 pt-4">
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg px-3 bg-muted/10">
                <AccordionItem value="skills" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-serif text-primary">
                      <Award className="w-4 h-4" /> Perícias Oficiais V5 & Especializações (27 Perícias)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Físicas */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-blood uppercase tracking-wider block border-b border-blood/20 pb-1">
                          Perícias Físicas
                        </span>
                        {V5_SKILLS_LIST.fisicas.map((s) => {
                          const skillData = getSkillData(s.key);
                          return (
                            <div key={s.key} className="space-y-1 bg-background/50 p-1.5 rounded border border-border/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground font-medium">{s.label}</span>
                                <DotRating
                                  value={skillData.nivel}
                                  min={0}
                                  size="sm"
                                  onChange={(v) => setSkillNivel(s.key, v)}
                                />
                              </div>
                              {skillData.nivel > 0 && (
                                <Input
                                  placeholder="Especialização (ex: Fuzis)"
                                  value={skillData.especializacao}
                                  onChange={(e) => setSkillSpec(s.key, e.target.value)}
                                  className="h-6 text-[10px] bg-background"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Sociais */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block border-b border-amber-400/20 pb-1">
                          Perícias Sociais
                        </span>
                        {V5_SKILLS_LIST.sociais.map((s) => {
                          const skillData = getSkillData(s.key);
                          return (
                            <div key={s.key} className="space-y-1 bg-background/50 p-1.5 rounded border border-border/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground font-medium">{s.label}</span>
                                <DotRating
                                  value={skillData.nivel}
                                  min={0}
                                  size="sm"
                                  onChange={(v) => setSkillNivel(s.key, v)}
                                />
                              </div>
                              {skillData.nivel > 0 && (
                                <Input
                                  placeholder="Especialização (ex: Intimidação Física)"
                                  value={skillData.especializacao}
                                  onChange={(e) => setSkillSpec(s.key, e.target.value)}
                                  className="h-6 text-[10px] bg-background"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Mentais */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block border-b border-blue-400/20 pb-1">
                          Perícias Mentais
                        </span>
                        {V5_SKILLS_LIST.mentais.map((s) => {
                          const skillData = getSkillData(s.key);
                          return (
                            <div key={s.key} className="space-y-1 bg-background/50 p-1.5 rounded border border-border/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground font-medium">{s.label}</span>
                                <DotRating
                                  value={skillData.nivel}
                                  min={0}
                                  size="sm"
                                  onChange={(v) => setSkillNivel(s.key, v)}
                                />
                              </div>
                              {skillData.nivel > 0 && (
                                <Input
                                  placeholder="Especialização (ex: Criptografia)"
                                  value={skillData.especializacao}
                                  onChange={(e) => setSkillSpec(s.key, e.target.value)}
                                  className="h-6 text-[10px] bg-background"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Seção 3: Vantagens, Defeitos e Antecedentes */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5 font-serif text-primary">
                  <Award className="w-4 h-4" /> Vantagens, Defeitos e Antecedentes (Backgrounds)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddAdvantage}
                  className="h-8 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </Button>
              </div>

              {advantages.length === 0 ? (
                <div className="p-3 border border-dashed border-border rounded-lg text-center bg-muted/10">
                  <p className="text-xs text-muted-foreground">Nenhuma vantagem, defeito ou antecedente registrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {advantages.map((adv) => (
                    <div key={adv.id} className="flex items-center gap-2 p-2 bg-surface-container-low border border-border/40 rounded-md">
                      <Select
                        value={adv.tipo}
                        onValueChange={(val) => handleUpdateAdvantage(adv.id, "tipo", val)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background w-32 font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vantagem" className="text-xs text-emerald-400 font-bold">Vantagem</SelectItem>
                          <SelectItem value="Defeito" className="text-xs text-rose-400 font-bold">Defeito</SelectItem>
                          <SelectItem value="Antecedente" className="text-xs text-blue-400 font-bold">Antecedente</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Nome (ex: Recursos, Cobrador de Dívidas)"
                        value={adv.nome}
                        onChange={(e) => handleUpdateAdvantage(adv.id, "nome", e.target.value)}
                        className="h-8 text-xs bg-background flex-1"
                      />

                      <div className="px-2">
                        <DotRating
                          value={adv.pontos}
                          min={1}
                          max={5}
                          size="sm"
                          onChange={(v) => handleUpdateAdvantage(adv.id, "pontos", v)}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAdvantage(adv.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
