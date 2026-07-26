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
import { Trash2, Plus, Sparkles, Award, BookOpen, ShieldAlert, Heart, Zap, ShieldCheck, Flame, Layers, Skull, Crosshair } from "lucide-react";
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

export interface V5PredatorTypeInfo {
  name: string;
  label: string;
  specialtyOptions: Array<{ skill: string; skillLabel: string; name: string }>;
  disciplineOptions: string[];
  description: string;
}

export interface V5SkillProfileInfo {
  name: string;
  label: string;
  limits: Record<number, number>;
  description: string;
}

// Chaves Oficiais dos 9 Atributos V5
export const V5_ATTRIBUTE_KEYS = [
  "forca", "destreza", "vigor",
  "carisma", "manipulacao", "compostura",
  "inteligencia", "raciocinio", "perseveranca",
] as const;

// Limites Oficiais de Distribuição de Atributos V5 na Criação (1x4, 3x3, 4x2, 1x1)
export const V5_ATTRIBUTE_LIMITS: Record<number, { max: number; label: string }> = {
  4: { max: 1, label: "Melhor (4 Pts)" },
  3: { max: 3, label: "Bons (3 Pts)" },
  2: { max: 4, label: "Médios (2 Pts)" },
  1: { max: 1, label: "Pior (1 Pt)" },
};

// Perfis Oficiais de Distribuição de Perícias V5 na Criação
export const V5_SKILL_PROFILES: Record<string, V5SkillProfileInfo> = {
  JackOfAllTrades: {
    name: "JackOfAllTrades",
    label: "Pau para Toda Obra (Jack-of-all-trades)",
    limits: { 4: 0, 3: 1, 2: 8, 1: 10 },
    description: "1 Habilidade no nível 3, 8 Habilidades no nível 2 e 10 Habilidades no nível 1.",
  },
  Balanced: {
    name: "Balanced",
    label: "Balanceado (Balanced)",
    limits: { 4: 0, 3: 3, 2: 5, 1: 7 },
    description: "3 Habilidades no nível 3, 5 Habilidades no nível 2 e 7 Habilidades no nível 1.",
  },
  Specialist: {
    name: "Specialist",
    label: "Especialista (Specialist)",
    limits: { 4: 1, 3: 3, 2: 3, 1: 3 },
    description: "1 Habilidade no nível 4, 3 Habilidades no nível 3, 3 no nível 2 e 3 no nível 1.",
  },
  Custom: {
    name: "Custom",
    label: "Livre / Narrador (Custom)",
    limits: { 5: 5, 4: 5, 3: 27, 2: 27, 1: 27 },
    description: "Distribuição livre de pontos sem travas automáticas de perfil.",
  },
};

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

// Mapeamento Oficial de 10 Tipos de Predador (Predator Types V5)
export const V5_PREDATOR_TYPES: Record<string, V5PredatorTypeInfo> = {
  Alleycat: {
    name: "Alleycat",
    label: "Felino de Beco (Alleycat)",
    specialtyOptions: [
      { skill: "intimidacao", skillLabel: "Intimidação", name: "Assalto Violento" },
      { skill: "briga", skillLabel: "Briga", name: "Imobilização / Grappling" },
    ],
    disciplineOptions: ["Potência", "Rapidez"],
    description: "Você toma o sangue à força através de violência direta ou emboscadas em becos escuros.",
  },
  Bagger: {
    name: "Bagger",
    label: "Sacoleiro (Bagger)",
    specialtyOptions: [
      { skill: "ladroagem", skillLabel: "Ladroagem", name: "Infiltração em Hospitais" },
      { skill: "manha", skillLabel: "Manha", name: "Mercado Negro de Sangue" },
    ],
    disciplineOptions: ["Feitiçaria de Sangue", "Ofuscação"],
    description: "Você compra ou rouba bolsas de sangue preservadas de hospitais e bancos de sangue.",
  },
  BloodLeech: {
    name: "BloodLeech",
    label: "Sanguessuga (Blood Leech)",
    specialtyOptions: [
      { skill: "briga", skillLabel: "Briga", name: "Vampiros" },
      { skill: "subterfugio", skillLabel: "Subterfúgio", name: "Sedução de Membros" },
    ],
    disciplineOptions: ["Feitiçaria de Sangue", "Dominação"],
    description: "Você se alimenta exclusivamente do sangue de outros vampiros.",
  },
  Cleaver: {
    name: "Cleaver",
    label: "Cortador / Falsa Família (Cleaver)",
    specialtyOptions: [
      { skill: "persuasao", skillLabel: "Persuasão", name: "Gaslighting Familiar" },
      { skill: "subterfugio", skillLabel: "Subterfúgio", name: "Manter Aparências" },
    ],
    disciplineOptions: ["Dominação", "Animalismo"],
    description: "Você se alimenta secretamente da sua própria família ou de uma família mortal que você mantém.",
  },
  Consensualist: {
    name: "Consensualist",
    label: "Consensualista (Consensualist)",
    specialtyOptions: [
      { skill: "medicina", skillLabel: "Medicina", name: "Flebotomia / Coleta" },
      { skill: "persuasao", skillLabel: "Persuasão", name: "Obtenção de Consentimento" },
    ],
    disciplineOptions: ["Auspícios", "Fortitude"],
    description: "Você se alimenta apenas com o consentimento explícito dos mortais.",
  },
  Farmer: {
    name: "Farmer",
    label: "Fazendeiro (Farmer)",
    specialtyOptions: [
      { skill: "trato_animais", skillLabel: "Trato c/ Animais", name: "Caça Doméstica" },
      { skill: "sobrevivencia", skillLabel: "Sobrevivência", name: "Rastreamento de Animais" },
    ],
    disciplineOptions: ["Animalismo", "Metamorfose"],
    description: "Você recusa se alimentar de humanos e bebe apenas sangue de animais.",
  },
  Osiris: {
    name: "Osiris",
    label: "Osíris (Osiris)",
    specialtyOptions: [
      { skill: "performance", skillLabel: "Performance", name: "Atração de Fãs" },
      { skill: "subterfugio", skillLabel: "Subterfúgio", name: "Doutrinação de Culto" },
    ],
    disciplineOptions: ["Presença", "Feitiçaria de Sangue"],
    description: "Você é um ídolo, guru ou artista cujos devotos doam sangue voluntariamente.",
  },
  Sandman: {
    name: "Sandman",
    label: "João Pestana (Sandman)",
    specialtyOptions: [
      { skill: "furtividade", skillLabel: "Furtividade", name: "Invasão Noturna" },
      { skill: "ladroagem", skillLabel: "Ladroagem", name: "Arrombamento de Fechaduras" },
    ],
    disciplineOptions: ["Auspícios", "Ofuscação"],
    description: "Você se esgueira em residências e se alimenta de mortais enquanto eles dormem.",
  },
  SceneQueen: {
    name: "SceneQueen",
    label: "Rainha da Cena (Scene Queen)",
    specialtyOptions: [
      { skill: "manha", skillLabel: "Manha", name: "Subcultura Noturna" },
      { skill: "etiqueta", skillLabel: "Etiqueta", name: "Camarotes / Áreas VIP" },
    ],
    disciplineOptions: ["Presença", "Dominação"],
    description: "Você domina uma subcultura específica (gótica, rave, alta sociedade) e caça no seu círculo social.",
  },
  Siren: {
    name: "Siren",
    label: "Sereia (Siren)",
    specialtyOptions: [
      { skill: "persuasao", skillLabel: "Persuasão", name: "Sedução" },
      { skill: "subterfugio", skillLabel: "Subterfúgio", name: "Encontros de Uma Noite" },
    ],
    disciplineOptions: ["Fortitude", "Presença"],
    description: "Você usa atratividade e sedução para alimentar-se de parceiros casuais.",
  },
};

// Sugestões de Especializações Oficiais V5 por Perícia
export const V5_RECOMMENDED_SPECIALTIES: Record<string, string[]> = {
  // Físicas
  atletismo: ["Corrida", "Escalada", "Parkour", "Natação", "Arremesso"],
  briga: ["Soco", "Chute", "Imobilização", "Mordida Vampírica", "Esquiva em Combate"],
  conducao: ["Carros de Passeio", "Motocicletas", "Perseguição", "Fuga", "Caminhões"],
  armas_fogo: ["Pistolas", "Fuzis de Assalto", "Snipers", "Espingardas", "Saque Rápido"],
  furtividade: ["Mimetismo em Sombras", "Rastreamento Urbano", "Perseguição Silenciosa", "Invasão"],
  armas_brancas: ["Espadas", "Facas", "Machados", "Bastões", "Parry / Bloqueio"],
  oficios: ["Carpintaria", "Eletrônica", "Armaria", "Escultura", "Mecânica Automotiva"],
  sobrevivencia: ["Florestas", "Deserto", "Rastreamento de Pistas", "Abrigo de Emergência"],
  ladroagem: ["Arrombamento de Fechaduras", "Furtar Bolsos", "Bypass de Alarmes", "Infiltração"],

  // Sociais
  empatia: ["Detectar Mentiras", "Emoções Ocultas", "Traumas", "Intenções de Combate"],
  etiqueta: ["Alta Sociedade / Élite", "Camarilla", "Submundo / Anarquistas", "Eventos VIP"],
  intimidacao: ["Ameaças Físicas", "Coerção Psicológica", "Tortura", "Postura Predatória"],
  lideranca: ["Comando Tático", "Motivação de Tropas", "Oratória", "Inspiração"],
  manha: ["Mercado Negro", "Rumores da Cidade", "Rotas de Fuga", "Gangues Urbanas"],
  performance: ["Canto", "Atuação", "Dança", "Oratória", "Instrumentos de Corda"],
  persuasao: ["Negociação", "Sedução", "Barganha", "Debates Políticos"],
  subterfugio: ["Lábia / Mentira", "Sedução Disfarçada", "Disfarce", "Imitation de Voz"],
  trato_animais: ["Cães de Guarda", "Gatos", "Aves de Rapina", "Ratos", "Cavalos"],

  // Mentais
  erudicao: ["História da Camarilla", "Direito", "Literatura", "Pesquisa Arquivística", "Línguas Antigas"],
  ciencias: ["Química", "Física", "Biologia Molecular", "Genética", "Geologia"],
  financas: ["Mercado de Ações", "Lavagem de Dinheiro", "Imóveis", "Avaliação de Bens"],
  investigacao: ["Cenas de Crime", "Análise de Evidências", "Interrogatório", "Pesquisa Digital"],
  medicina: ["Cirurgia", "Primeiros Socorros", "Toxicologia", "Flebotomia", "Patologia"],
  ocultismo: ["Rituais de Feitiçaria", "Gehenna", "Nodismo", "Alquimia", "Fantasmas"],
  percepcao: ["Emboscadas", "Aura", "Disfarces de Ofuscação", "Audição Aguçada"],
  politica: ["Polícia Local", "Tribunais da Camarilla", "Conselho Anarquista", "Burocracia Municipal"],
  tecnologia: ["Hacking", "Segurança de Redes", "Criptografia", "Hardware / Servidores"],
};

// As 4 Perícias Inatas que exigem Especialização Obrigatória no V5
export const INNATE_SPECIALTY_SKILLS = new Set(["erudicao", "oficios", "performance", "ciencias"]);

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

// Lista Oficial das 27 Perícias Oficiais V5 (Divididas em 3 Blocos de 9)
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
    { key: "ladroagem", label: "Ladroagem" },
  ],
  sociais: [
    { key: "empatia", label: "Empatia" },
    { key: "etiqueta", label: "Etiqueta" },
    { key: "intimidacao", label: "Intimidação" },
    { key: "lideranca", label: "Liderança" },
    { key: "manha", label: "Manha" },
    { key: "performance", label: "Performance" },
    { key: "persuasao", label: "Persuasão" },
    { key: "subterfugio", label: "Subterfúgio" },
    { key: "trato_animais", label: "Trato c/ Animais" },
  ],
  mentais: [
    { key: "erudicao", label: "Erudição" },
    { key: "ciencias", label: "Ciências" },
    { key: "financas", label: "Finanças" },
    { key: "investigacao", label: "Investigação" },
    { key: "medicina", label: "Medicina" },
    { key: "ocultismo", label: "Ocultismo" },
    { key: "percepcao", label: "Percepção" },
    { key: "politica", label: "Política" },
    { key: "tecnologia", label: "Tecnologia" },
  ],
};

const SKILL_KEY_ALIASES: Record<string, string> = {
  larcenia: "ladroagem",
  ladragem: "ladroagem",
  expressao: "etiqueta",
  labia: "subterfugio",
  academismo: "erudicao",
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

// Multiplicador Oficial de Disciplina V5 (Clã = 5, Caitiff/Sangue-Fraco = 6, Fora do Clã = 7)
export function getV5DisciplineMultiplier(clanName: string, discName: string): number {
  const normClan = (clanName || "").toLowerCase();
  if (normClan === "caitiff" || normClan === "sangue-fraco") return 6;
  const clanInfo = V5_CLANS_DATA[clanName];
  const clanDiscSet = new Set((clanInfo?.disciplines || []).map((d) => d.toLowerCase()));
  if (clanDiscSet.has((discName || "").toLowerCase())) return 5;
  return 7;
}

const defaultPlayer = {
  character_name: "", player_name: "", clan: "Ventrue", sire: "", generation: 13,
  hunger: 0, humanity: 7, stains: 0, blood_potency: 1,
  xp_total: 0, xp_spent: 0, clan_bane: "", predator_type: "", predator_specialty: "",
  skill_distribution_profile: "Balanced",
  enforce_attr_limits: true,
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

  // Handler de Tipo de Predador (Predator Type V5)
  const handlePredatorTypeChange = (pKey: string) => {
    const pInfo = V5_PREDATOR_TYPES[pKey];
    setForm((prev) => ({
      ...prev,
      predator_type: pKey,
      predator_specialty: "",
    }));
    if (pInfo) {
      toast.info(`Tipo de Predador alterado para ${pInfo.label}. Escolha a especialização abaixo.`);
    }
  };

  const handleApplyPredatorSpecialty = (specVal: string) => {
    const [skillKey, specName] = specVal.split(":");
    if (skillKey && specName) {
      addSkillSpec(skillKey, specName);
      setForm((prev) => ({ ...prev, predator_specialty: specVal }));
      const skillLabel = Object.values(V5_SKILLS_LIST)
        .flat()
        .find((s) => s.key === skillKey)?.label || skillKey;
      toast.success(`Especialização do Predador aplicada: ${skillLabel} (${specName})`);
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

  const handleGenerationChange = (gen: number) => {
    const lim = getV5BloodPotencyLimits(gen);
    const clampedBp = Math.max(lim.min, Math.min(lim.max, form.blood_potency || lim.min));
    setForm((prev) => ({ ...prev, generation: gen, blood_potency: clampedBp }));
  };

  // Helper para Perícias + Especializações (Especializações como Array de Strings em JSONB)
  function getSkillData(key: string): { nivel: number; especializacao: string[] } {
    const aliasKey = SKILL_KEY_ALIASES[key] || key;
    const raw = form.skills?.[key] || form.skills?.[aliasKey];

    if (typeof raw === "number") return { nivel: raw, especializacao: [] };
    if (raw && typeof raw === "object") {
      let specList: string[] = [];
      if (Array.isArray(raw.especializacao)) {
        specList = raw.especializacao.filter((s: any) => typeof s === "string" && s.trim().length > 0);
      } else if (typeof raw.especializacao === "string" && raw.especializacao.trim()) {
        specList = raw.especializacao
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      return { nivel: raw.nivel || 0, especializacao: specList };
    }
    return { nivel: 0, especializacao: [] };
  }

  // Helper de Contagem Reativa de Distribuição de Atributos V5
  function getAttributeDistributionCounts() {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    V5_ATTRIBUTE_KEYS.forEach((key) => {
      const val = Number(form[key as keyof typeof form]) || 1;
      if (val >= 1 && val <= 5) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });
    return counts;
  }

  const attrDistributionCounts = getAttributeDistributionCounts();

  // Helper de Contagem Reativa de Distribuição de Perícias
  function getSkillDistributionCounts() {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const allSkillKeys = Object.values(V5_SKILLS_LIST)
      .flat()
      .map((s) => s.key);

    allSkillKeys.forEach((key) => {
      const data = getSkillData(key);
      if (data.nivel > 0 && data.nivel <= 5) {
        counts[data.nivel] = (counts[data.nivel] || 0) + 1;
      }
    });
    return counts;
  }

  const skillDistributionCounts = getSkillDistributionCounts();

  // Handler de Potência de Sangue com Gasto Direto de XP (Novo Nível x 10 XP)
  const handleBloodPotencyChange = (newBP: number) => {
    const oldBP = form.blood_potency || bpLimits.min;
    const clamped = Math.max(bpLimits.min, Math.min(bpLimits.max, newBP));
    if (clamped !== oldBP) {
      let costDelta = 0;
      if (clamped > oldBP) {
        for (let lvl = oldBP + 1; lvl <= clamped; lvl++) costDelta += lvl * 10;
      } else {
        for (let lvl = clamped + 1; lvl <= oldBP; lvl++) costDelta -= lvl * 10;
      }

      setForm((prev) => ({
        ...prev,
        blood_potency: clamped,
        xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
        xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
      }));
    }
  };

  // Handler de Atributos com Validação de Criação V5 e Gasto Direto de XP (Novo Nível x 5 XP)
  const setAttr = (field: string, newLevel: number) => {
    const oldLevel = Number(form[field as keyof typeof form]) || 1;
    if (newLevel !== oldLevel) {
      if (form.enforce_attr_limits && newLevel > oldLevel && newLevel > 0) {
        const currentCounts = getAttributeDistributionCounts();
        const projectedCounts = { ...currentCounts };
        if (oldLevel > 0) projectedCounts[oldLevel] = Math.max(0, (projectedCounts[oldLevel] || 0) - 1);
        projectedCounts[newLevel] = (projectedCounts[newLevel] || 0) + 1;

        if (newLevel === 5) {
          toast.error("Na criação oficial do V5, nenhum atributo pode iniciar no Nível 5.");
          return;
        }

        const limitInfo = V5_ATTRIBUTE_LIMITS[newLevel];
        if (limitInfo && projectedCounts[newLevel] > limitInfo.max) {
          toast.error(
            `Limite do V5 atingido! Você só pode ter até ${limitInfo.max} atributo(s) no patamar "${limitInfo.label}".`
          );
          return;
        }
      }

      let costDelta = 0;
      if (newLevel > oldLevel) {
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) costDelta += lvl * 5;
      } else {
        for (let lvl = newLevel + 1; lvl <= oldLevel; lvl++) costDelta -= lvl * 5;
      }

      setForm((prev) => ({
        ...prev,
        [field]: newLevel,
        xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
        xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
      }));
    }
  };

  const setSkillNivel = (key: string, newLevel: number) => {
    const current = getSkillData(key);
    const oldLevel = current.nivel;

    if (newLevel !== oldLevel) {
      const profileKey = form.skill_distribution_profile || "Balanced";
      const profile = V5_SKILL_PROFILES[profileKey];

      // Validação de Limites por Perfil de Criação V5
      if (profile && profileKey !== "Custom" && newLevel > oldLevel && newLevel > 0) {
        const projectedCounts = { ...skillDistributionCounts };
        if (oldLevel > 0) projectedCounts[oldLevel] = Math.max(0, (projectedCounts[oldLevel] || 0) - 1);
        projectedCounts[newLevel] = (projectedCounts[newLevel] || 0) + 1;

        const maxAllowed = profile.limits[newLevel] ?? 0;
        if (projectedCounts[newLevel] > maxAllowed) {
          toast.error(
            `Limite do perfil "${profile.label}" atingido! Máximo de ${maxAllowed} perícia(s) no Nível ${newLevel}.`
          );
          return;
        }
      }

      let costDelta = 0;
      if (newLevel > oldLevel) {
        for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) costDelta += lvl * 3;
      } else {
        for (let lvl = newLevel + 1; lvl <= oldLevel; lvl++) costDelta -= lvl * 3;
      }

      setForm((prev) => ({
        ...prev,
        skills: {
          ...(prev.skills || {}),
          [key]: { nivel: newLevel, especializacao: current.especializacao },
        },
        xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
        xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
      }));
    }
  };

  // Handlers de Múltiplas Especializações por Perícia V5
  const addSkillSpec = (key: string, specName: string) => {
    const cleanSpec = specName.trim();
    if (!cleanSpec) return;

    const current = getSkillData(key);
    if (current.especializacao.includes(cleanSpec)) {
      toast.info(`Especialização "${cleanSpec}" já adicionada.`);
      return;
    }

    const updatedSpecs = [...current.especializacao, cleanSpec];
    const costDelta = 3; // Custo oficial V5: 3 XP por nova especialização

    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [key]: { nivel: current.nivel, especializacao: updatedSpecs },
      },
      xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
      xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
    }));
    toast.success(`Especialização "${cleanSpec}" adicionada (+3 XP).`);
  };

  const removeSkillSpec = (key: string, specIdx: number) => {
    const current = getSkillData(key);
    const targetSpec = current.especializacao[specIdx];
    const updatedSpecs = current.especializacao.filter((_, idx) => idx !== specIdx);
    const refund = 3;

    setForm((prev) => ({
      ...prev,
      skills: {
        ...(prev.skills || {}),
        [key]: { nivel: current.nivel, especializacao: updatedSpecs },
      },
      xp_total: (prev.xp_total || 0) + refund,
      xp_spent: Math.max(0, (prev.xp_spent || 0) - refund),
    }));
    if (targetSpec) {
      toast.info(`Especialização "${targetSpec}" removida (-3 XP reembolsados).`);
    }
  };

  // Handlers de Disciplinas com Gasto Direto de XP (Clã = Nível x 5 / Caitiff ou Sangue-Fraco = Nível x 6 / Fora = Nível x 7)
  const handleAddDiscipline = () => {
    const newDiscName = "Fortitude";
    const multiplier = getV5DisciplineMultiplier(form.clan, newDiscName);
    const costDelta = 1 * multiplier;

    setDisciplines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: newDiscName, nivel: 1, poderes: [""] },
    ]);

    setForm((prev) => ({
      ...prev,
      xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
      xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
    }));
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
    const targetDisc = disciplines.find((d) => d.id === id);
    if (!targetDisc) return;
    const oldNivel = targetDisc.nivel;

    if (clamped !== oldNivel) {
      const multiplier = getV5DisciplineMultiplier(form.clan, targetDisc.nome);

      let costDelta = 0;
      if (clamped > oldNivel) {
        for (let lvl = oldNivel + 1; lvl <= clamped; lvl++) costDelta += lvl * multiplier;
      } else {
        for (let lvl = clamped + 1; lvl <= oldNivel; lvl++) costDelta -= lvl * multiplier;
      }

      setDisciplines((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
          const currentPoderes = d.poderes || [];
          const newPoderes = Array.from({ length: clamped }, (_, i) => currentPoderes[i] || "");
          return { ...d, nivel: clamped, poderes: newPoderes };
        })
      );

      setForm((prev) => ({
        ...prev,
        xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
        xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
      }));
    }
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
    const targetDisc = disciplines.find((d) => d.id === id);
    if (targetDisc) {
      const multiplier = getV5DisciplineMultiplier(form.clan, targetDisc.nome);
      let refund = 0;
      for (let lvl = 1; lvl <= targetDisc.nivel; lvl++) refund += lvl * multiplier;

      setForm((prev) => ({
        ...prev,
        xp_total: (prev.xp_total || 0) + refund,
        xp_spent: Math.max(0, (prev.xp_spent || 0) - refund),
      }));
    }
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  // Handlers Vantagens/Defeitos/Antecedentes com Gasto Direto de XP (3 XP por ponto)
  const handleAddAdvantage = () => {
    const costDelta = 1 * 3;
    setAdvantages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", tipo: "Vantagem", pontos: 1 },
    ]);

    setForm((prev) => ({
      ...prev,
      xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
      xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
    }));
  };

  const handleUpdateAdvantage = (id: string, field: keyof PlayerAdvantage, value: any) => {
    if (field === "pontos") {
      const target = advantages.find((a) => a.id === id);
      if (target && typeof value === "number") {
        const oldPts = target.pontos || 1;
        const costDelta = (value - oldPts) * 3;
        setForm((prev) => ({
          ...prev,
          xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
          xp_spent: Math.max(0, (prev.xp_spent || 0) + costDelta),
        }));
      }
    }
    setAdvantages((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleRemoveAdvantage = (id: string) => {
    const target = advantages.find((a) => a.id === id);
    if (target) {
      const refund = (target.pontos || 1) * 3;
      setForm((prev) => ({
        ...prev,
        xp_total: (prev.xp_total || 0) + refund,
        xp_spent: Math.max(0, (prev.xp_spent || 0) - refund),
      }));
    }
    setAdvantages((prev) => prev.filter((a) => a.id !== id));
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
      disciplines,
      advantages,
    };

    onSave(playerData);
    onOpenChange(false);
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  // Helper de Renderização de Item de Perícia com Múltiplas Especializações V5
  const renderSkillItem = (s: { key: string; label: string }) => {
    const skillData = getSkillData(s.key);
    const isInnate = INNATE_SPECIALTY_SKILLS.has(s.key);
    const isMissingInnate = isInnate && skillData.nivel > 0 && skillData.especializacao.length === 0;
    const recSpecs = V5_RECOMMENDED_SPECIALTIES[s.key] || [];

    return (
      <div
        key={s.key}
        className={`space-y-1.5 p-2 rounded border transition-colors ${
          isMissingInnate
            ? "bg-rose-950/20 border-rose-500/50"
            : "bg-background/50 border-border/30"
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground font-medium flex items-center gap-1">
            {s.label}
            {isInnate && (
              <span
                className="text-[9px] text-amber-400 font-bold px-1 bg-amber-950/40 rounded border border-amber-500/30"
                title="Exige especialização obrigatória no V5 ao colocar ponto"
              >
                Inata
              </span>
            )}
          </span>
          <DotRating
            value={skillData.nivel}
            min={0}
            size="sm"
            onChange={(v) => setSkillNivel(s.key, v)}
          />
        </div>

        {skillData.nivel > 0 && (
          <div className="space-y-1.5 pt-0.5">
            {/* Badges de Especializações Ativas */}
            {skillData.especializacao.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {skillData.especializacao.map((spec, specIdx) => (
                  <span
                    key={specIdx}
                    className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-semibold px-1.5 py-0.5 rounded"
                  >
                    <span>{spec}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillSpec(s.key, specIdx)}
                      className="hover:text-rose-400 text-muted-foreground text-xs leading-none ml-0.5"
                      title="Remover Especialização"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Selector de Sugestões V5 */}
            <Select
              onValueChange={(val) => {
                if (val) addSkillSpec(s.key, val);
              }}
            >
              <SelectTrigger className="h-6 text-[10px] bg-background font-semibold w-full">
                <SelectValue placeholder="Sugestões Oficiais V5..." />
              </SelectTrigger>
              <SelectContent className="max-h-40">
                {recSpecs.map((specName) => (
                  <SelectItem key={specName} value={specName} className="text-[10px]">
                    {specName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <SkillSpecCustomAdder
              onAdd={(text) => addSkillSpec(s.key, text)}
              isMissingInnate={isMissingInnate}
            />
          </div>
        )}
      </div>
    );
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
                    onChange={handleBloodPotencyChange}
                  />
                </div>
              </div>
            </div>

            {/* Tipo de Predador (Predator Type V5) */}
            <div className="bg-muted/10 p-3 rounded-lg border border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-blood flex items-center gap-1.5 font-serif">
                  <Crosshair className="w-4 h-4 text-blood" /> Tipo de Predador (Predator Type V5)
                </Label>
                <span className="text-[10px] text-muted-foreground italic">Estilo de Caça Noturna</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Selecione o Tipo de Predador</Label>
                  <Select
                    value={form.predator_type || ""}
                    onValueChange={handlePredatorTypeChange}
                  >
                    <SelectTrigger className="mt-1 bg-background font-semibold text-xs h-8">
                      <SelectValue placeholder="Escolha o estilo de caça..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Object.entries(V5_PREDATOR_TYPES).map(([pKey, pInfo]) => (
                        <SelectItem key={pKey} value={pKey} className="text-xs">
                          {pInfo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.predator_type && V5_PREDATOR_TYPES[form.predator_type] && (
                  <div>
                    <Label className="text-xs text-emerald-400 font-semibold">Especialização Recomendada do Predador</Label>
                    <Select
                      value={form.predator_specialty || ""}
                      onValueChange={handleApplyPredatorSpecialty}
                    >
                      <SelectTrigger className="mt-1 bg-background font-semibold text-xs h-8 border-emerald-500/40">
                        <SelectValue placeholder="Aplicar especialização do predador..." />
                      </SelectTrigger>
                      <SelectContent>
                        {V5_PREDATOR_TYPES[form.predator_type].specialtyOptions.map((opt, idx) => (
                          <SelectItem key={idx} value={`${opt.skill}:${opt.name}`} className="text-xs">
                            {opt.skillLabel}: {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {form.predator_type && V5_PREDATOR_TYPES[form.predator_type] && (
                <div className="p-2.5 bg-background/60 border border-border/40 rounded text-xs space-y-1">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {V5_PREDATOR_TYPES[form.predator_type].description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold uppercase text-primary">Disciplinas Recomendadas:</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {V5_PREDATOR_TYPES[form.predator_type].disciplineOptions.join(" ou ")}
                    </span>
                  </div>
                </div>
              )}
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

              {/* Experiência (XP Total Saldo e XP Gasto Acumulado com Tabela V5) */}
              <div className="space-y-2 border-l border-border/40 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Gestão de XP (Tabela Oficial V5)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Gasto Direto Reativo
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-bold text-emerald-400">XP Total (Saldo) *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.xp_total || 0}
                      onChange={(e) => set("xp_total", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-emerald-950/20 border border-emerald-500/40 text-emerald-400 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold text-rose-400">XP Gasto (Acumulado) *</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.xp_spent || 0}
                      onChange={(e) => set("xp_spent", parseInt(e.target.value) || 0)}
                      className="h-8 text-xs bg-muted/30 border border-border text-rose-400 font-bold font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic pt-0.5">
                  Elevações na ficha (Atributos: Nível×5, Perícias: Nível×3, Disciplinas: Clã Nível×5 / Fora Nível×7 / Caitiff Nível×6, BP: Nível×10) abatem do Saldo e somam no Gasto.
                </p>
              </div>
            </div>

            {/* Seção 1: Atributos V5 (9 Atributos Oficiais + Trava de Criação V5) */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5 font-serif text-primary">
                    <Sparkles className="w-4 h-4" /> Atributos Oficiais V5 (3 Categorias de 3)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Criação V5: 1x4 (Melhor), 3x3 (Bons), 4x2 (Médios), 1x1 (Pior).
                  </p>
                </div>
                <Button
                  type="button"
                  variant={form.enforce_attr_limits ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => set("enforce_attr_limits", !form.enforce_attr_limits)}
                  className="h-7 text-[10px] font-semibold uppercase tracking-wider"
                >
                  {form.enforce_attr_limits ? "Trava Criação V5: Ativa" : "Modo Livre / XP"}
                </Button>
              </div>

              {/* Resumo Dinâmico dos Limites de Atributos V5 */}
              {form.enforce_attr_limits && (
                <div className="p-2.5 bg-background/60 border border-border/40 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[4, 3, 2, 1].map((lvl) => {
                    const limitInfo = V5_ATTRIBUTE_LIMITS[lvl];
                    const currentCount = attrDistributionCounts[lvl] || 0;
                    const isFull = currentCount === limitInfo.max;
                    const isOver = currentCount > limitInfo.max;

                    return (
                      <div
                        key={lvl}
                        className={`p-1.5 rounded text-center border text-xs ${
                          isOver
                            ? "bg-rose-950/30 border-rose-500/50 text-rose-400 font-bold"
                            : isFull
                            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 font-semibold"
                            : "bg-muted/30 border-border/30 text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px] block uppercase tracking-wider font-mono">
                          {limitInfo.label}
                        </span>
                        <span className="text-xs font-bold font-mono">
                          {currentCount} / {limitInfo.max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/10 p-3 rounded-lg border border-border/40">
                {/* Físicos */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-blood uppercase tracking-wider block border-b border-blood/20 pb-1">
                    Físicos
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Força</Label>
                      <DotRating value={form.forca || 1} min={1} onChange={(v) => setAttr("forca", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Destreza</Label>
                      <DotRating value={form.destreza || 1} min={1} onChange={(v) => setAttr("destreza", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Vigor</Label>
                      <DotRating value={form.vigor || 1} min={1} onChange={(v) => setAttr("vigor", v)} />
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
                      <DotRating value={form.carisma || 1} min={1} onChange={(v) => setAttr("carisma", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Manipulação</Label>
                      <DotRating value={form.manipulacao || 1} min={1} onChange={(v) => setAttr("manipulacao", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Compostura</Label>
                      <DotRating value={form.compostura || 1} min={1} onChange={(v) => setAttr("compostura", v)} />
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
                      <DotRating value={form.inteligencia || 1} min={1} onChange={(v) => setAttr("inteligencia", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Raciocínio</Label>
                      <DotRating value={form.raciocinio || 1} min={1} onChange={(v) => setAttr("raciocinio", v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Perseverança</Label>
                      <DotRating value={form.perseveranca || 1} min={1} onChange={(v) => setAttr("perseveranca", v)} />
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
                    (Compostura {form.compostura || 1} + Perseverança {form.perseveranca || 1})
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

            {/* Seção 2: Perícias V5 + Distribuição de Perfil V5 */}
            <div className="border-t border-border/60 pt-4">
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg px-3 bg-muted/10">
                <AccordionItem value="skills" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-serif text-primary">
                      <Award className="w-4 h-4" /> Perícias Oficiais V5 (27 Perícias) & Distribuição de Criação
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-4">
                    {/* Seletor de Perfil de Distribuição V5 */}
                    <div className="p-3 bg-background/60 border border-border/40 rounded-lg space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Perfil de Distribuição de Criação (V5)
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            {V5_SKILL_PROFILES[form.skill_distribution_profile || "Balanced"]?.description}
                          </p>
                        </div>
                        <Select
                          value={form.skill_distribution_profile || "Balanced"}
                          onValueChange={(val) => set("skill_distribution_profile", val)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-background font-semibold w-full sm:w-64">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(V5_SKILL_PROFILES).map(([pKey, pInfo]) => (
                              <SelectItem key={pKey} value={pKey} className="text-xs">
                                {pInfo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resumo Dinâmico dos Limites por Nível */}
                      {form.skill_distribution_profile !== "Custom" && (
                        <div className="pt-2 border-t border-border/30 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[4, 3, 2, 1].map((lvl) => {
                            const profile = V5_SKILL_PROFILES[form.skill_distribution_profile || "Balanced"];
                            const maxAllowed = profile?.limits[lvl] ?? 0;
                            const currentCount = skillDistributionCounts[lvl] || 0;
                            const isFull = currentCount === maxAllowed && maxAllowed > 0;
                            const isOver = currentCount > maxAllowed;

                            return (
                              <div
                                key={lvl}
                                className={`p-1.5 rounded text-center border text-xs ${
                                  isOver
                                    ? "bg-rose-950/30 border-rose-500/50 text-rose-400 font-bold"
                                    : isFull
                                    ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 font-semibold"
                                    : "bg-muted/30 border-border/30 text-muted-foreground"
                                }`}
                              >
                                <span className="text-[10px] block uppercase tracking-wider font-mono">Nível {lvl}</span>
                                <span className="text-xs font-bold font-mono">
                                  {currentCount} / {maxAllowed}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Físicas */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-blood uppercase tracking-wider block border-b border-blood/20 pb-1">
                          Perícias Físicas (9)
                        </span>
                        {V5_SKILLS_LIST.fisicas.map((s) => renderSkillItem(s))}
                      </div>

                      {/* Sociais */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block border-b border-amber-400/20 pb-1">
                          Perícias Sociais (9)
                        </span>
                        {V5_SKILLS_LIST.sociais.map((s) => renderSkillItem(s))}
                      </div>

                      {/* Mentais */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block border-b border-blue-400/20 pb-1">
                          Perícias Mentais (9)
                        </span>
                        {V5_SKILLS_LIST.mentais.map((s) => renderSkillItem(s))}
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

function SkillSpecCustomAdder({
  onAdd,
  isMissingInnate,
}: {
  onAdd: (val: string) => void;
  isMissingInnate: boolean;
}) {
  const [val, setVal] = useState("");

  const handleAdd = () => {
    if (val.trim()) {
      onAdd(val.trim());
      setVal("");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        placeholder={
          isMissingInnate
            ? "* Adicionar Especialização Obrigatória..."
            : "Digitar nova especialização..."
        }
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        className={`h-6 text-[10px] bg-background flex-1 ${
          isMissingInnate
            ? "border-rose-500 text-rose-300 placeholder:text-rose-400/70 font-semibold"
            : ""
        }`}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={!val.trim()}
        className="h-6 px-1.5 text-[10px] bg-background border-border"
        title="Adicionar Especialização"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}
