import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
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
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Sparkles, Award, BookOpen, ShieldAlert, Heart, Zap, ShieldCheck, Flame, Layers, Skull, Crosshair, UserCheck, UserPlus, Clock, Lock } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateUUID } from "@/lib/uuid";

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
  isPredatorBonus?: boolean;
  isHomebrew?: boolean;
}

export interface PlayerConviction {
  id: string;
  conviction: string;
  touchstone_name: string;
  touchstone_relation: string;
  status: "active" | "damaged" | "destroyed";
  npc_id?: string;
  touchstone_type?: "existing" | "new";
  touchstone_seita?: string;
  touchstone_clan?: string;
  touchstone_title?: string;
}

export interface V5MeritCatalogItem {
  nome: string;
  tipo: "Vantagem" | "Defeito" | "Antecedente";
  pontosDefault: number;
  descricao: string;
}

export const V5_MERITS_CATALOG: V5MeritCatalogItem[] = [
  // Antecedentes
  { nome: "Aliados (Allies)", tipo: "Antecedente", pontosDefault: 1, descricao: "Mortais que apoiam e ajudam o personagem." },
  { nome: "Contatos (Contacts)", tipo: "Antecedente", pontosDefault: 1, descricao: "Fontes de informação no mundo mortal ou vampírico." },
  { nome: "Fama (Fame)", tipo: "Antecedente", pontosDefault: 1, descricao: "Reconhecimento no mundo mortal." },
  { nome: "Mawla (Mentor)", tipo: "Antecedente", pontosDefault: 1, descricao: "Membro mais antigo que orienta e protege o personagem." },
  { nome: "Rebanho (Herd)", tipo: "Antecedente", pontosDefault: 1, descricao: "Vítimas mortais dedicadas para alimentação segura." },
  { nome: "Recursos (Resources)", tipo: "Antecedente", pontosDefault: 1, descricao: "Riqueza, dinheiro e patrimônio mensal." },
  { nome: "Refúgio (Haven)", tipo: "Antecedente", pontosDefault: 1, descricao: "Local seguro para dormir durante o dia." },
  { nome: "Status (Camarilla/Anarquistas)", tipo: "Antecedente", pontosDefault: 1, descricao: "Respeito e posição na sociedade da noite." },

  // Vantagens Físicas/Sociais
  { nome: "Aparência Deslumbrante (Beautiful)", tipo: "Vantagem", pontosDefault: 2, descricao: "+2 dados em interações baseadas em atração." },
  { nome: "Digestão Eficiente (Iron Gullet)", tipo: "Vantagem", pontosDefault: 3, descricao: "Consegue ingerir sangue frio ou râncido." },
  { nome: "Sono Leve (Unbondable)", tipo: "Vantagem", pontosDefault: 2, descricao: "Dificuldade menor para despertar de dia." },

  // Defeitos
  { nome: "Alimentação Restrita (Farmer / Blood Leech)", tipo: "Defeito", pontosDefault: 1, descricao: "Só consegue se alimentar de fontes específicas." },
  { nome: "Estigma Noturno (Repulsion)", tipo: "Defeito", pontosDefault: 1, descricao: "Aversão folclórica (alho, crucifixos, etc)." },
  { nome: "Inimigo (Enemy)", tipo: "Defeito", pontosDefault: 1, descricao: "Rival mortal ou vampiro que busca prejudicar o personagem." },
  { nome: "Segredo Sombrio (Dark Secret)", tipo: "Defeito", pontosDefault: 1, descricao: "Um segredo que, se revelado, causará caçada ou ruína." },
  { nome: "Incapaz de Beijar (No Bite)", tipo: "Defeito", pontosDefault: 1, descricao: "Não possui presas funcionais." },
];

export interface V5PredatorTypeInfo {
  name: string;
  label: string;
  specialtyOptions: Array<{ skill: string; skillLabel: string; name: string }>;
  disciplineOptions: string[];
  meritsAndFlaws: Array<{ nome: string; tipo: "Vantagem" | "Defeito" | "Antecedente"; pontos: number }>;
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
    meritsAndFlaws: [
      { nome: "Fumaça do Sangue / Capanga", tipo: "Vantagem", pontos: 1 },
      { nome: "Segredo Sombrio (Criminoso)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Contatos (Banco de Sangue)", tipo: "Antecedente", pontos: 1 },
      { nome: "Alimentação Restrita (Sangue Frio)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Status ou Vício em Vitae", tipo: "Vantagem", pontos: 1 },
      { nome: "Inimigo (Membros)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Refúgio (Família Mortal)", tipo: "Antecedente", pontos: 1 },
      { nome: "Segredo Sombrio (Cleaver)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Aliados (Consentimento)", tipo: "Antecedente", pontos: 1 },
      { nome: "Segredo Sombrio (Violador)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Refúgio / Animal de Estimação", tipo: "Antecedente", pontos: 1 },
      { nome: "Alimentação Restrita (Animais)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Rebanho (Culto)", tipo: "Antecedente", pontos: 2 },
      { nome: "Inimigo (Hater/Investigador)", tipo: "Defeito", pontos: 1 },
    ],
    description: "Você é um ídolo, guru ou artista cujos devotos doam sangue voluntariamente.",
  },
  Sandman: {
    name: "Sandman",
    label: "Sandman",
    specialtyOptions: [
      { skill: "furtividade", skillLabel: "Furtividade", name: "Invasão Noturna" },
      { skill: "ladroagem", skillLabel: "Ladroagem", name: "Arrombamento de Fechaduras" },
    ],
    disciplineOptions: ["Auspícios", "Ofuscação"],
    meritsAndFlaws: [
      { nome: "Recursos / Refúgio", tipo: "Antecedente", pontos: 1 },
      { nome: "Estigma Noturno", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Fama / Contatos (Subcultura)", tipo: "Antecedente", pontos: 2 },
      { nome: "Inimigo (Rival da Cena)", tipo: "Defeito", pontos: 1 },
    ],
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
    meritsAndFlaws: [
      { nome: "Aparência Deslumbrante", tipo: "Vantagem", pontos: 2 },
      { nome: "Inimigo (Ex-Parceiro Vingativo)", tipo: "Defeito", pontos: 1 },
    ],
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

// ═══════════════════════════════════════════════════════════
// ESTATUTO E IDADE DO VAMPIRO (SEA OF TIME V5)
// Regras Oficiais do Livro Básico de Vampiro: A Máscara V5
// ═══════════════════════════════════════════════════════════
export interface V5AgeCategoryInfo {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  suggestedGenerationMin: number;
  suggestedGenerationMax: number;
  defaultGeneration: number;
  bloodPotency: number;
  humanity: number;
  xpBonus: number;
  meritBonusPoints: number;
  flawBonusPoints: number;
  additionalPerks: string[];
}

export const V5_AGE_CATEGORIES: Record<string, V5AgeCategoryInfo> = {
  Fledgling: {
    id: "Fledgling",
    name: "Recém-Abraçado / Childer",
    subtitle: "< 15 anos de Abraço",
    description: "Abraçado recentemente. Baixa Potência de Sangue, sem pontos extras de experiência ou estatuto político elevado.",
    suggestedGenerationMin: 12,
    suggestedGenerationMax: 16,
    defaultGeneration: 13,
    bloodPotency: 0,
    humanity: 7,
    xpBonus: 0,
    meritBonusPoints: 0,
    flawBonusPoints: 0,
    additionalPerks: ["3 Pts em Vantagens", "2 Pts em Defeitos"],
  },
  Neonate: {
    id: "Neonate",
    name: "Neonato (Neonate)",
    subtitle: "15 a 80 anos de Abraço (1940 – recente)",
    description: "Padrão de criação V5. Já sobreviveu aos primeiros anos da noite e conhece as regras da Máscara.",
    suggestedGenerationMin: 12,
    suggestedGenerationMax: 13,
    defaultGeneration: 12,
    bloodPotency: 1,
    humanity: 7,
    xpBonus: 15,
    meritBonusPoints: 0,
    flawBonusPoints: 0,
    additionalPerks: ["+15 XP inicial livre", "3 Pts em Vantagens", "2 Pts em Defeitos"],
  },
  Ancilla: {
    id: "Ancilla",
    name: "Ancilla",
    subtitle: "80 a 250 anos de Abraço (1780 – 1940)",
    description: "Vampiro experiente com presença política no Domínio. Mais poderoso, porém sofre erosão de Humanidade.",
    suggestedGenerationMin: 10,
    suggestedGenerationMax: 11,
    defaultGeneration: 10,
    bloodPotency: 2,
    humanity: 6,
    xpBonus: 35,
    meritBonusPoints: 2,
    flawBonusPoints: 2,
    additionalPerks: ["+35 XP inicial", "+2 Pts Vantagens extras", "+2 Pts Defeitos extras", "+1 Status", "+1 Recursos", "-1 Humanidade inicial"],
  },
  Elder: {
    id: "Elder",
    name: "Ancião (Elder)",
    subtitle: "> 250 anos de Abraço (Antes de 1780)",
    description: "Lorde das sombras com vasto sangue ancestral. Potência de Sangue elevada, mas Humanidade desgastada pelas eras.",
    suggestedGenerationMin: 8,
    suggestedGenerationMax: 9,
    defaultGeneration: 9,
    bloodPotency: 3,
    humanity: 5,
    xpBonus: 60,
    meritBonusPoints: 3,
    flawBonusPoints: 3,
    additionalPerks: ["+60 XP inicial", "+3 Pts Vantagens extras", "+3 Pts Defeitos extras", "+2 Status", "-2 Humanidade inicial"],
  },
};

// Cálculo Automático de Humanidade Inicial V5 (Idade/Estatuto + Modificador de Predador)
export function calculateV5InitialHumanity(ageCategoryKey: string, predatorTypeKey: string): number {
  const ageInfo = V5_AGE_CATEGORIES[ageCategoryKey] || V5_AGE_CATEGORIES.Neonate;
  let humanity = ageInfo.humanity; // Base V5 por Idade: Fledgling=7, Neonate=7, Ancilla=6, Elder=5

  if (predatorTypeKey === "Alleycat") {
    humanity -= 1; // Gato de Rua (Alleycat) reduz 1 de Humanidade
  } else if (predatorTypeKey === "Farmer") {
    humanity += 1; // Fazendeiro (Farmer) aumenta 1 em Humanidade
  }

  return Math.max(1, Math.min(10, humanity));
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
  age_category: "Neonate",
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
            className={`${dotSize} rounded-full border border-border transition-all ${isActive
              ? "bg-blood shadow-[0_0_5px_hsl(var(--blood)/0.6)] border-blood"
              : "bg-muted/40 hover:bg-muted"
              }`}
          />
        );
      })}
    </div>
  );
}

export interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: any;
  onDelete?: (id: string) => void;
  onSave: (player: any) => void;
  isReadOnly?: boolean;
}

export function PlayerDialog({ open, onOpenChange, player, onDelete, onSave, isReadOnly = false }: PlayerDialogProps) {
  const [form, setForm] = useState(defaultPlayer);
  const [disciplines, setDisciplines] = useState<PlayerDiscipline[]>([]);
  const [advantages, setAdvantages] = useState<PlayerAdvantage[]>([]);
  const [convictions, setConvictions] = useState<PlayerConviction[]>([]);
  const [npcs, setNpcs] = useCloudStorage<any[]>("v5_npcs", []);
  const [relMap, setRelMap] = useCloudStorage<any[]>("v5_relationship_map", []);

  const isEditing = !!player;

  useEffect(() => {
    if (player) {
      // 1. Parsing de Disciplinas com Estrutura de Poderes
      let parsedDisciplines: PlayerDiscipline[] = [];
      if (Array.isArray(player.disciplines)) {
        parsedDisciplines = player.disciplines.map((d: any) => ({
          id: d.id || generateUUID(),
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
            parsedAdvantages.push({ id: m.id || generateUUID(), nome: m.nome, tipo: "Vantagem", pontos: m.pontos || 1 });
          });
        }
        if (Array.isArray(player.flaws)) {
          player.flaws.forEach((f: any) => {
            parsedAdvantages.push({ id: f.id || generateUUID(), nome: f.nome, tipo: "Defeito", pontos: f.pontos || 1 });
          });
        }
      }
      setAdvantages(parsedAdvantages);

      // 3. Parsing de Convicções e Pilares (V5) com npc_id
      let parsedConvictions: PlayerConviction[] = [];
      if (Array.isArray(player.convictions)) {
        parsedConvictions = player.convictions.map((c: any) => ({
          id: c.id || generateUUID(),
          conviction: c.conviction || c.conviccao || "",
          touchstone_name: c.touchstone_name || c.pilar_nome || "",
          touchstone_relation: c.touchstone_relation || c.pilar_relacao || "",
          status: c.status || "active",
          npc_id: c.npc_id,
          touchstone_type: c.touchstone_type || (c.npc_id ? "existing" : "new"),
        }));
      }
      setConvictions(parsedConvictions);

      setForm({
        ...defaultPlayer,
        ...player,
        age_category: player.age_category || "Neonate",
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
            id: generateUUID(),
            nome: dName,
            nivel: 1,
            poderes: [""],
          }))
        );
      } else {
        setDisciplines([]);
      }
      setAdvantages([]);
      setConvictions([]);
    }
  }, [player, open]);

  // Handler de Troca de Estatuto / Faixa Etária (Sea of Time V5)
  const handleAgeCategoryChange = (newCategory: string) => {
    const info = V5_AGE_CATEGORIES[newCategory];
    if (!info) return;

    const oldCategoryKey = form.age_category || "Neonate";
    const oldCategoryInfo = V5_AGE_CATEGORIES[oldCategoryKey] || V5_AGE_CATEGORIES.Neonate;

    const xpDiff = info.xpBonus - oldCategoryInfo.xpBonus;
    const newGen = info.defaultGeneration;
    const bpLimits = getV5BloodPotencyLimits(newGen);
    const newBp = Math.max(bpLimits.min, Math.min(bpLimits.max, info.bloodPotency));
    const newHumanity = calculateV5InitialHumanity(newCategory, form.predator_type);

    setForm((prev) => ({
      ...prev,
      age_category: newCategory,
      generation: newGen,
      blood_potency: newBp,
      humanity: newHumanity,
      xp_total: Math.max(0, (prev.xp_total || 0) + xpDiff),
    }));

    toast.info(
      `Estatuto V5 alterado para ${info.name}: Geração ${newGen}ª, Potência de Sangue ${newBp}, Humanidade ${newHumanity} (${info.xpBonus > 0 ? `+${info.xpBonus} XP bônus` : "Criação padrão"}).`
    );
  };

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
        id: generateUUID(),
        nome: dName,
        nivel: 1,
        poderes: [""],
      }));
      setDisciplines(autoDisciplines);
      toast.info(`Disciplinas atualizadas para o Clã ${newClan}: ${clanInfo.disciplines.join(", ")}`);
    }
  };

  // Handler de Tipo de Predador com Automação de Vantagens/Defeitos Gratuitos e Humanidade V5
  const handlePredatorTypeChange = (pKey: string) => {
    const pInfo = V5_PREDATOR_TYPES[pKey];
    const newHumanity = calculateV5InitialHumanity(form.age_category || "Neonate", pKey);

    setForm((prev) => ({
      ...prev,
      predator_type: pKey,
      predator_specialty: "",
      humanity: newHumanity,
    }));

    if (pInfo) {
      // Remove vantagens anteriores de predador e injeta as novas do estilo de caça
      setAdvantages((prev) => {
        const nonPredatorAdvantages = prev.filter((a) => !a.isPredatorBonus);
        const predatorBonusItems: PlayerAdvantage[] = (pInfo.meritsAndFlaws || []).map((mf) => ({
          id: generateUUID(),
          nome: mf.nome,
          tipo: mf.tipo,
          pontos: mf.pontos,
          isPredatorBonus: true,
        }));
        return [...nonPredatorAdvantages, ...predatorBonusItems];
      });

      const humText = pKey === "Alleycat" ? " (-1 Humanidade)" : pKey === "Farmer" ? " (+1 Humanidade)" : "";
      toast.info(
        `Tipo de Predador alterado para ${pInfo.label}.${humText} Humanidade calculada: ${newHumanity}.`
      );
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
        ...(prev.enforce_attr_limits === false ? { xp_total: Math.max(0, (prev.xp_total || 0) - costDelta) } : {}),
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
        ...(prev.enforce_attr_limits === false ? { xp_total: Math.max(0, (prev.xp_total || 0) - costDelta) } : {}),
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
        ...(prev.enforce_attr_limits === false ? { xp_total: Math.max(0, (prev.xp_total || 0) - costDelta) } : {}),
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
      ...(prev.enforce_attr_limits === false ? { xp_total: Math.max(0, (prev.xp_total || 0) - costDelta) } : {}),
    }));
    toast.success(`Especialização "${cleanSpec}" adicionada${form.enforce_attr_limits === false ? " (+3 XP)." : "."}`);
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
      ...(prev.enforce_attr_limits === false ? { xp_total: (prev.xp_total || 0) + refund } : {}),
    }));
    if (targetSpec) {
      toast.info(`Especialização "${targetSpec}" removida${form.enforce_attr_limits === false ? " (-3 XP reembolsados)." : "."}`);
    }
  };

  // Helper de Cálculo de Orçamento Rígido de Disciplinas (V5: 2 Pts em Disciplinas do Clã, Máx Nível 2)
  const getDisciplineBudgetSummary = () => {
    const clanInfo = V5_CLANS_DATA[form.clan] || V5_CLANS_DATA["Ventrue"];
    const clanDisciplines = clanInfo?.disciplines || [];
    const isSpecialClan = form.clan === "Caitiff" || form.clan === "Sangue-Fraco";

    let totalPointsSpent = 0;
    let inClanPointsSpent = 0;
    let outOfClanPointsSpent = 0;

    disciplines.forEach((d) => {
      const pts = d.nivel || 1;
      totalPointsSpent += pts;
      const isInClan = isSpecialClan || clanDisciplines.includes(d.nome);
      if (isInClan) {
        inClanPointsSpent += pts;
      } else {
        outOfClanPointsSpent += pts;
      }
    });

    const maxCreationBudget = 2;
    const remainingCreationBudget = maxCreationBudget - totalPointsSpent;

    return {
      totalPointsSpent,
      inClanPointsSpent,
      outOfClanPointsSpent,
      maxCreationBudget,
      remainingCreationBudget,
      clanDisciplines,
      isSpecialClan,
    };
  };

  const discBudget = getDisciplineBudgetSummary();

  // Handlers de Disciplinas com Trava de Criação V5 (2 Pts de Clã, Máx Nível 2)
  const handleAddDiscipline = () => {
    if (form.enforce_attr_limits !== false) {
      if (discBudget.remainingCreationBudget <= 0) {
        toast.error(
          `Limite de Disciplinas de criação V5 atingido! Você possui 2 pontos de criação inicial (Já alocado: ${discBudget.totalPointsSpent}/2 Pts).`
        );
        return;
      }
    }

    const clanInfo = V5_CLANS_DATA[form.clan] || V5_CLANS_DATA["Ventrue"];
    const availableClanDisc = clanInfo?.disciplines?.find(
      (cd) => !disciplines.some((d) => d.nome === cd)
    );
    const newDiscName = availableClanDisc || clanInfo?.disciplines?.[0] || "Fortitude";

    const multiplier = getV5DisciplineMultiplier(form.clan, newDiscName);
    const costDelta = 1 * multiplier;

    setDisciplines((prev) => [
      ...prev,
      { id: generateUUID(), nome: newDiscName, nivel: 1, poderes: [""] },
    ]);

    if (form.enforce_attr_limits === false) {
      setForm((prev) => ({
        ...prev,
        xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
      }));
    }
  };

  const handleUpdateDisciplineName = (id: string, newNome: string) => {
    const targetDisc = disciplines.find((d) => d.id === id);
    if (!targetDisc) return;

    if (form.enforce_attr_limits !== false) {
      const clanInfo = V5_CLANS_DATA[form.clan] || V5_CLANS_DATA["Ventrue"];
      const isSpecialClan = form.clan === "Caitiff" || form.clan === "Sangue-Fraco";
      const isInClan = isSpecialClan || (clanInfo?.disciplines || []).includes(newNome);

      if (!isInClan) {
        toast.error(
          `Na criação inicial do V5, os 2 pontos de Disciplina devem ser gastos exclusivamente nas Disciplinas do seu Clã (${(
            clanInfo?.disciplines || []
          ).join(", ")}).`
        );
        return;
      }
    }

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
      if (form.enforce_attr_limits !== false) {
        const clanInfo = V5_CLANS_DATA[form.clan] || V5_CLANS_DATA["Ventrue"];
        const isSpecialClan = form.clan === "Caitiff" || form.clan === "Sangue-Fraco";
        const isInClan = isSpecialClan || (clanInfo?.disciplines || []).includes(targetDisc.nome);

        if (!isInClan && clamped > oldNivel) {
          toast.error(
            `Na criação inicial do V5, apenas Disciplinas do Clã (${(
              clanInfo?.disciplines || []
            ).join(", ")}) podem receber pontos.`
          );
          return;
        }

        if (clamped > 2) {
          toast.error(
            `Trava V5: Na criação inicial do V5, nenhuma disciplina pode ultrapassar o Nível 2.`
          );
          return;
        }

        const deltaNivel = clamped - oldNivel;
        if (deltaNivel > 0 && discBudget.totalPointsSpent + deltaNivel > 2) {
          toast.error(
            `Estouro do Orçamento de Disciplinas V5! Orçamento inicial é de 2 pontos (Já alocado: ${discBudget.totalPointsSpent}/2 Pts).`
          );
          return;
        }
      }

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

      if (form.enforce_attr_limits === false) {
        setForm((prev) => ({
          ...prev,
          xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
        }));
      }
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

      if (form.enforce_attr_limits === false) {
        setForm((prev) => ({
          ...prev,
          xp_total: (prev.xp_total || 0) + refund,
        }));
      }
    }
    setDisciplines((prev) => prev.filter((d) => d.id !== id));
  };

  // Helper de Cálculo de Orçamento de Vantagens e Defeitos (V5)
  const getAdvantagesBudgetSummary = () => {
    let freeMeritPointsSpent = 0;
    let flawPointsChosen = 0;

    advantages.forEach((adv) => {
      if (adv.isPredatorBonus) return;
      const pts = adv.pontos || 1;
      if (adv.tipo === "Defeito") {
        flawPointsChosen += pts;
      } else {
        freeMeritPointsSpent += pts;
      }
    });

    const ageCatInfo = V5_AGE_CATEGORIES[form.age_category || "Neonate"] || V5_AGE_CATEGORIES.Neonate;
    const baseMeritBonus = ageCatInfo.meritBonusPoints || 0;
    const maxFlawBonus = 2 + (ageCatInfo.flawBonusPoints || 0);

    const flawBonusAllowed = Math.min(maxFlawBonus, flawPointsChosen);
    const totalMeritBudget = 7 + baseMeritBonus + flawBonusAllowed;
    const remainingMeritBudget = totalMeritBudget - freeMeritPointsSpent;

    return {
      baseBudget: 7 + baseMeritBonus,
      flawPointsChosen,
      maxFlawBonus,
      flawBonusAllowed,
      totalMeritBudget,
      freeMeritPointsSpent,
      remainingMeritBudget,
    };
  };

  const advBudget = getAdvantagesBudgetSummary();

  const handleAddAdvantageFromCatalog = (catalogItemName: string) => {
    let newItem: PlayerAdvantage;
    if (catalogItemName === "custom") {
      newItem = {
        id: generateUUID(),
        nome: "Vantagem Personalizada (Homebrew)",
        tipo: "Vantagem",
        pontos: 1,
        isHomebrew: true,
      };
    } else {
      const item = V5_MERITS_CATALOG.find((m) => m.nome === catalogItemName);
      if (!item) return;
      newItem = {
        id: generateUUID(),
        nome: item.nome,
        tipo: item.tipo,
        pontos: item.pontosDefault,
      };
    }

    // Trava de Orçamento Rígida V5 na Criação
    if (form.enforce_attr_limits !== false) {
      if (newItem.tipo !== "Defeito") {
        if (advBudget.remainingMeritBudget - newItem.pontos < 0) {
          toast.error(
            `Estouro de Orçamento V5! Saldo livre disponível: ${advBudget.remainingMeritBudget} pt(s). Item custa ${newItem.pontos} pt(s).`
          );
          return;
        }
      } else {
        if (advBudget.flawPointsChosen + newItem.pontos > 2) {
          toast.error(
            `Trava V5: O limite de Defeitos de criação é de 2 pontos. Você já alocou ${advBudget.flawPointsChosen} pt(s).`
          );
          return;
        }
      }
    }

    setAdvantages((prev) => [...prev, newItem]);
    toast.success(`${newItem.tipo} "${newItem.nome}" adicionada.`);
  };

  const handleUpdateAdvantage = (id: string, field: keyof PlayerAdvantage, value: any) => {
    const target = advantages.find((a) => a.id === id);
    if (!target) return;

    if (field === "pontos" && !target.isPredatorBonus && typeof value === "number") {
      const oldPts = target.pontos || 1;
      const deltaPts = value - oldPts;

      if (form.enforce_attr_limits !== false && deltaPts > 0) {
        if (target.tipo !== "Defeito") {
          if (advBudget.remainingMeritBudget - deltaPts < 0) {
            toast.error(
              `Estouro de Orçamento V5! Saldo livre disponível: ${advBudget.remainingMeritBudget} pt(s).`
            );
            return;
          }
        } else {
          if (advBudget.flawPointsChosen + deltaPts > 2) {
            toast.error(
              `Trava V5: O teto máximo de Defeitos na criação é de 2 pontos.`
            );
            return;
          }
        }
      }

      const costDelta = deltaPts * 3;
      if (form.enforce_attr_limits === false) {
        setForm((prev) => ({
          ...prev,
          xp_total: Math.max(0, (prev.xp_total || 0) - costDelta),
        }));
      }
    }

    setAdvantages((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleRemoveAdvantage = (id: string) => {
    const target = advantages.find((a) => a.id === id);
    if (target && !target.isPredatorBonus && form.enforce_attr_limits === false) {
      const refund = (target.pontos || 1) * 3;
      setForm((prev) => ({
        ...prev,
        xp_total: (prev.xp_total || 0) + refund,
      }));
    }
    setAdvantages((prev) => prev.filter((a) => a.id !== id));
  };

  // Handlers de Convicções e Pilares (V5) com Integração em 3 Frentes (Convicção, Galeria de NPCs e Teia de Intrigas)
  const handleAddConviction = () => {
    setConvictions((prev) => [
      ...prev,
      {
        id: generateUUID(),
        conviction: "",
        touchstone_name: "",
        touchstone_relation: "",
        status: "active",
        touchstone_type: (npcs || []).length > 0 ? "existing" : "new",
      },
    ]);
  };

  const handleSelectExistingNpcForTouchstone = (convictionId: string, npcId: string) => {
    const targetNpc = (npcs || []).find((n) => n && n.id === npcId);
    if (!targetNpc) return;

    const npcName = targetNpc.name || targetNpc.nome || "NPC";
    const npcDesc = targetNpc.description || targetNpc.concept || targetNpc.conceito || "Pilar do Vampiro";

    // Injeta/sincroniza nó na Teia de Intrigas (v5_relationship_map)
    const existingRel = (relMap || []).find(
      (r) => r && r.target_id === npcId && r.source_id === (form.id || player?.id)
    );

    if (!existingRel) {
      const newRelNode = {
        id: generateUUID(),
        source_id: form.id || player?.id || "player_active",
        source_name: form.character_name || player?.character_name || "Vampiro",
        target_id: npcId,
        target_name: npcName,
        relation_type: "Touchstone",
        label: `Pilar de Humanidade (${npcDesc})`,
        status: targetNpc.status || "active",
      };
      setRelMap((prev) => [...(prev || []), newRelNode]);
    }

    setConvictions((prev) =>
      prev.map((c) => {
        if (c.id !== convictionId) return c;
        return {
          ...c,
          npc_id: targetNpc.id,
          touchstone_name: npcName,
          touchstone_relation: npcDesc,
          status: targetNpc.status || c.status || "active",
          touchstone_type: "existing",
        };
      })
    );
    toast.success(`Pilar vinculado ao NPC "${npcName}" e integrado à Teia de Intrigas!`);
  };

  const handleCreateNewNpcForTouchstone = (
    cId: string,
    name: string,
    relation: string,
    initialStatus: "active" | "damaged" | "destroyed",
    seita: string = "Mortal",
    clan: string = "Mortal",
    title: string = "Pilar"
  ) => {
    if (!name.trim()) {
      toast.error("Nome do Pilar/NPC é obrigatório.");
      return;
    }

    const newNpcId = generateUUID();
    const cleanName = name.trim();
    const cleanRelation = relation.trim() || "Pilar Mortal de Humanidade";
    const cleanCategory = seita || "Mortal";
    const cleanClan = clan || "Mortal";
    const cleanTitle = title.trim() || "Pilar";

    // 1. Injeção na Galeria Central de NPCs da Crônica (v5_npcs) com Estrutura Completa Simplificada
    const newNpc = {
      id: newNpcId,
      name: cleanName,
      nome: cleanName,
      category: cleanCategory, // Categoria fundamental para agrupamento na Galeria de NPCs (NpcsPage)
      seita: cleanCategory,
      clan: cleanClan,
      title: cleanTitle,
      role: cleanTitle,
      cargo: cleanTitle,
      species_faction: `${cleanClan} / ${cleanCategory}`,
      concept: `${cleanTitle} - Pilar de Humanidade`,
      description: cleanRelation,
      history: `Pilar de Humanidade do personagem ${form.character_name || player?.character_name || ""}. ${cleanRelation}`,
      appearance: cleanRelation,
      status: initialStatus === "destroyed" ? "Morte Final" : initialStatus || "Ativo",
      is_touchstone: true,
      player_id: form.id || player?.id,
      player_name: form.character_name || player?.character_name || "Vampiro",
    };
    setNpcs((prev) => [...(prev || []), newNpc]);

    // 2. Injeção na Teia de Intrigas / Mapa de Relacionamento (v5_relationship_map)
    const newRelNode = {
      id: generateUUID(),
      source_id: form.id || player?.id || "player_active",
      source_name: form.character_name || player?.character_name || "Vampiro",
      target_id: newNpcId,
      target_name: cleanName,
      relation_type: "Touchstone",
      label: `Pilar (${cleanTitle}: ${cleanRelation})`,
      status: initialStatus || "active",
    };
    setRelMap((prev) => [...(prev || []), newRelNode]);

    // 3. Injeção no Objeto de Convicção da Ficha (convictions)
    setConvictions((prev) =>
      prev.map((c) => {
        if (c.id !== cId) return c;
        return {
          ...c,
          npc_id: newNpcId,
          touchstone_name: cleanName,
          touchstone_relation: cleanRelation,
          touchstone_seita: cleanCategory,
          touchstone_clan: cleanClan,
          touchstone_title: cleanTitle,
          status: initialStatus,
          touchstone_type: "new",
        };
      })
    );

    toast.success(`NPC "${cleanName}" (${cleanClan}/${cleanCategory}) salvo na Galeria de NPCs, na Teia de Intrigas e vinculado!`);
  };

  const handleUpdateConviction = (id: string, field: keyof PlayerConviction, value: any) => {
    if (field === "status") {
      if (value === "damaged") {
        setForm((prev) => ({ ...prev, stains: Math.min(10, (prev.stains || 0) + 1) }));
        toast.warning("Pilar ferido! +1 Mancha adicionada à trilha de Humanidade.");
      } else if (value === "destroyed") {
        setForm((prev) => ({ ...prev, stains: Math.min(10, (prev.stains || 0) + 2) }));
        toast.error("Pilar destruído! +2 Manchas adicionadas à trilha de Humanidade.");
      }
    }
    setConvictions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };
        if (field === "status" && c.npc_id) {
          setNpcs((npcList) =>
            (npcList || []).map((npc) => (npc && npc.id === c.npc_id ? { ...npc, status: value === "destroyed" ? "Morte Final" : value } : npc))
          );
          setRelMap((relList) =>
            (relList || []).map((r) => (r && r.target_id === c.npc_id ? { ...r, status: value } : r))
          );
        }
        return updated;
      })
    );
  };

  const handleRemoveConviction = (id: string) => {
    const targetConviction = convictions.find((c) => c.id === id);
    if (targetConviction && targetConviction.npc_id) {
      setRelMap((prev) => (prev || []).filter((r) => r.target_id !== targetConviction.npc_id));
    }
    setConvictions((prev) => prev.filter((c) => c.id !== id));
  };

  // Automação do Teste de Remorso Oficial V5 (Reserva = max(1, 10 - Humanidade - Manchas))
  const handleRollRemorse = () => {
    const hum = form.humanity || 7;
    const st = form.stains || 0;

    if (st <= 0) {
      toast.info("O personagem não possui Manchas acumuladas nesta sessão. Não há necessidade de Teste de Remorso.");
      return;
    }

    const remorsePool = Math.max(1, 10 - hum - st);
    const rolls: number[] = [];
    let successes = 0;

    for (let i = 0; i < remorsePool; i++) {
      const r = Math.floor(Math.random() * 10) + 1;
      rolls.push(r);
      if (r >= 6) successes++;
    }

    const rollListStr = rolls.join(", ");

    if (successes >= 1) {
      setForm((prev) => ({ ...prev, stains: 0 }));
      toast.success(
        `🎲 Teste de Remorso (Reserva ${remorsePool}d10: [${rollListStr}]) -> ÊXITO! (${successes} sucesso(s)). Manchas limpas! Humanidade (${hum}) mantida.`,
        { duration: 6000 }
      );
    } else {
      const newHum = Math.max(0, hum - 1);
      setForm((prev) => ({ ...prev, humanity: newHum, stains: 0 }));
      toast.error(
        `🎲 Teste de Remorso (Reserva ${remorsePool}d10: [${rollListStr}]) -> FALHA! (0 sucessos). Sofreu Degeneração Moral. Humanidade caiu de ${hum} para ${newHum}. Manchas limpas!`,
        { duration: 7000 }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      toast.error("Esta ficha está trancada pelo Narrador. Alterações não são permitidas.");
      return;
    }
    if (!form.character_name || !form.character_name.trim()) {
      toast.error("Nome do personagem é obrigatório.");
      return;
    }

    const playerData = {
      ...form,
      character_name: form.character_name.trim(),
      id: isEditing ? player.id : generateUUID(),
      health_max: calculatedHealthMax,
      willpower_max: calculatedWillpowerMax,
      health_current: Math.max(0, calculatedHealthMax - (form.sup_dmg || 0) - (form.agr_dmg || 0)),
      willpower_current: Math.max(0, calculatedWillpowerMax - (form.fw_sup || 0) - (form.fw_agr || 0)),
      disciplines,
      advantages,
      convictions,
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
        className={`space-y-1.5 p-2 rounded border transition-colors ${isMissingInnate
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
            {isReadOnly && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Ficha Trancada pelo Narrador:</strong> Esta ficha está protegida contra alterações. Você pode visualizar todos os atributos, disciplinas e detalhes, mas edições estão temporariamente desabilitadas.
                </span>
              </div>
            )}
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

            {/* Estatuto & Idade do Vampiro (Sea of Time V5) */}
            <div className="bg-muted/10 p-3 rounded-lg border border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-blood flex items-center gap-1.5 font-serif">
                  <Clock className="w-4 h-4 text-blood" /> Estatuto & Idade do Vampiro (Sea of Time V5)
                </Label>
                <span className="text-[10px] text-muted-foreground italic">Regras Oficiais de Criação V5</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                <div>
                  <Label className="text-xs font-semibold">Faixa Etária / Estatuto *</Label>
                  <Select
                    value={form.age_category || "Neonate"}
                    onValueChange={handleAgeCategoryChange}
                  >
                    <SelectTrigger className="mt-1 bg-background font-semibold text-xs h-9 border-blood/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(V5_AGE_CATEGORIES).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-xs">
                          <span className="font-bold">{cat.name}</span>{" "}
                          <span className="text-[10px] text-muted-foreground">({cat.subtitle})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Card Informativo Dinâmico da Categoria Selecionada */}
                {(() => {
                  const currentCat = V5_AGE_CATEGORIES[form.age_category || "Neonate"] || V5_AGE_CATEGORIES.Neonate;
                  return (
                    <div className="bg-background/80 p-2.5 rounded border border-border/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blood text-[11px]">{currentCat.name}</span>
                        <Badge variant="outline" className="text-[9px] border-blood/40 text-blood font-mono font-bold">
                          {currentCat.xpBonus > 0 ? `+${currentCat.xpBonus} XP Inicial` : "Criação Padrão"}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {currentCat.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-border/30">
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">
                          Geração: {currentCat.suggestedGenerationMin}ª–{currentCat.suggestedGenerationMax}ª
                        </span>
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">
                          PS Inicial: {currentCat.bloodPotency}
                        </span>
                        <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">
                          Humanidade: {currentCat.humanity}
                        </span>
                        {currentCat.additionalPerks.map((perk, idx) => (
                          <span key={idx} className="text-[9px] bg-blood/10 text-blood border border-blood/20 px-1.5 py-0.5 rounded font-semibold">
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Senhor, Geração e Potência de Sangue Reativa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/10 p-3 rounded-lg border border-border/40">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold">Senhor (Sire)</Label>
                  <span className="text-[10px] text-muted-foreground italic">Galeria ou Digitação Livre</span>
                </div>
                <div className="relative">
                  <Select
                    value={form.sire || ""}
                    onValueChange={(val) => {
                      if (val !== "__custom__") {
                        set("sire", val);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue placeholder="Selecione ou digite o Sire..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value="Desconhecido / Desterrado" className="text-xs italic text-muted-foreground">
                        -- Desconhecido / Desterrado --
                      </SelectItem>
                      {(npcs || []).length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40">
                          NPCs da Crônica
                        </div>
                      )}
                      {(npcs || []).map((npc) => {
                        const npcName = npc.name || npc.nome || "NPC";
                        const npcClan = npc.clan || npc.species_faction || "Membro";
                        return (
                          <SelectItem key={npc.id || npcName} value={npcName} className="text-xs">
                            🧛 {npcName} ({npcClan})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {/* Input complementar para digitação livre caso prefira escrever o nome manualmente */}
                <Input
                  placeholder="Ou digite o nome do Sire..."
                  value={form.sire || ""}
                  onChange={(e) => set("sire", e.target.value)}
                  className="h-7 text-xs bg-background mt-1.5"
                />
              </div>

              <div>
                <Label className="text-xs">Geração ({form.generation || 13}ª)</Label>
                <Input
                  type="number"
                  min={4}
                  max={16}
                  value={form.generation || 13}
                  onChange={(e) => handleGenerationChange(parseInt(e.target.value) || 13)}
                  className="h-8 text-xs bg-background mt-1 font-mono font-bold"
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

                {/* Botão & Reserva do Teste de Remorso V5 */}
                <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Remorso: <span className="font-bold text-amber-400">{Math.max(1, 10 - (form.humanity || 7) - (form.stains || 0))}d10</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRollRemorse}
                    className="h-6 text-[10px] font-semibold border-amber-500/40 text-amber-300 hover:bg-amber-950/30 gap-1 px-2"
                    title="Rolar Teste de Remorso ao fim da sessão (10 - Humanidade - Manchas)"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" /> Rolar Remorso
                  </Button>
                </div>
              </div>

              {/* Experiência — XP Total (editável pelo Narrador) */}
              <div className="space-y-2 border-l border-border/40 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Gestão de XP (V5)
                  </span>
                  {(() => {
                    const ageCat = V5_AGE_CATEGORIES[form.age_category || "Neonate"] || V5_AGE_CATEGORIES.Neonate;
                    return ageCat.xpBonus > 0 ? (
                      <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 font-mono font-bold">
                        +{ageCat.xpBonus} XP ({ageCat.name.split(" ")[0]})
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/60 font-mono">Criação Padrão</span>
                    );
                  })()}
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-emerald-400">XP Total Disponível *</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.xp_total || 0}
                    onChange={(e) => set("xp_total", parseInt(e.target.value) || 0)}
                    className="h-8 text-sm bg-emerald-950/20 border border-emerald-500/40 text-emerald-400 font-bold font-mono mt-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic pt-0.5">
                  O XP Total (Saldo) é definido com base na Idade/Estatuto do personagem.
                  Na <strong>criação inicial V5</strong>, a distribuição de pontos é gratuita e não consome este saldo.
                  Ao alternar para o <strong>Modo Livre / Evolução</strong>, alterações na ficha abatem deste saldo (Atributos: Nível×5, Perícias: Nível×3, Disciplinas: Clã Nível×5 / Fora Nível×7, BP: Nível×10).
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
                        className={`p-1.5 rounded text-center border text-xs ${isOver
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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

              {/* Resumo Dinâmico do Orçamento de Disciplinas V5 */}
              <div className="p-2.5 bg-background/60 border border-border/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Disciplinas do Clã ({form.clan}):{" "}
                    <span className="font-bold text-amber-400">
                      {form.clan === "Caitiff" || form.clan === "Sangue-Fraco"
                        ? "Livre (Qualquer)"
                        : (V5_CLANS_DATA[form.clan]?.disciplines || []).join(", ")}
                    </span>
                  </span>
                  <span className="text-[11px] text-emerald-400">
                    Pontos Iniciais:{" "}
                    <span className="font-bold">
                      {discBudget.totalPointsSpent} / {discBudget.maxCreationBudget} Pts
                    </span>
                  </span>
                </div>
                <div className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-muted/40 border border-border/40">
                  Teto Máximo Criação: <span className="text-amber-400">Nível 2</span>
                </div>
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

                        {/* Seleção Automática de Poderes por Nível */}
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
                                  <SelectTrigger className="h-7 text-xs bg-background flex-1 font-medium">
                                    <SelectValue placeholder={`Selecione o poder de Nível ${lvl}...`} />
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
                                        Poder Customizado de Nível {lvl}
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
                                className={`p-1.5 rounded text-center border text-xs ${isOver
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

            {/* Seção 3: Vantagens, Defeitos e Antecedentes (Orçamento Oficial V5: 7 Vantagens + 2 Defeitos) */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5 font-serif text-primary">
                  <Award className="w-4 h-4" /> Vantagens, Defeitos e Antecedentes (Orçamento V5)
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(val) => {
                      if (val) handleAddAdvantageFromCatalog(val);
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs bg-background font-semibold w-56">
                      <SelectValue placeholder="Adicionar do Catálogo V5..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="custom" className="text-xs italic text-amber-400 font-bold">
                        -- Digitação Livre (Homebrew) --
                      </SelectItem>
                      {V5_MERITS_CATALOG.map((item) => (
                        <SelectItem key={item.nome} value={item.nome} className="text-xs">
                          [{item.tipo}] {item.nome} ({item.pontosDefault} pt)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resumo Dinâmico do Orçamento V5 */}
              <div className="p-2.5 bg-background/60 border border-border/40 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Orçamento Base: <span className="font-bold text-foreground">7 Pts</span>
                  </span>
                  <span className="text-[11px] text-rose-400">
                    Defeitos Escolhidos: <span className="font-bold">{advBudget.flawPointsChosen} / 2 Pts</span> (+{advBudget.flawBonusAllowed} bônus)
                  </span>
                  <span className="text-[11px] text-emerald-400">
                    Vantagens Gastas: <span className="font-bold">{advBudget.freeMeritPointsSpent} / {advBudget.totalMeritBudget} Pts</span>
                  </span>
                </div>
                <div className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-muted/40 border border-border/40">
                  Saldo Livre:{" "}
                  <span
                    className={
                      advBudget.remainingMeritBudget < 0
                        ? "text-rose-400 font-bold"
                        : advBudget.remainingMeritBudget === 0
                          ? "text-emerald-400 font-bold"
                          : "text-amber-400 font-bold"
                    }
                  >
                    {advBudget.remainingMeritBudget} Pts
                  </span>
                </div>
              </div>

              {/* Bloco 1: Vantagens Gratuitas de Predador (Totalmente Isoladas do Orçamento de 7 Pts) */}
              {advantages.some((a) => a.isPredatorBonus) && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/40 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-serif">
                    <Crosshair className="w-3.5 h-3.5" /> Traços Gratuitos do Tipo de Predador (Isolados do Orçamento)
                  </span>
                  <div className="space-y-1.5">
                    {advantages
                      .filter((a) => a.isPredatorBonus)
                      .map((adv) => (
                        <div
                          key={adv.id}
                          className="flex items-center justify-between p-2 bg-background/60 border border-amber-500/30 rounded text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-400">[{adv.tipo}]</span>
                            <span className="text-foreground font-medium">{adv.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                              {adv.pontos} Ponto(s) (Grátis)
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Bloco 2: Vantagens e Defeitos do Orçamento Livre de Criação */}
              {advantages.filter((a) => !a.isPredatorBonus).length === 0 ? (
                <div className="p-3 border border-dashed border-border rounded-lg text-center bg-muted/10">
                  <p className="text-xs text-muted-foreground">Nenhuma vantagem, defeito ou antecedente do orçamento alocado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {advantages
                    .filter((a) => !a.isPredatorBonus)
                    .map((adv) => (
                      <div
                        key={adv.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-md border transition-colors ${adv.isHomebrew
                          ? "bg-purple-950/20 border-purple-500/40"
                          : "bg-surface-container-low border-border/40"
                          }`}
                      >
                        <div className="flex items-center gap-2 flex-1 w-full">
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
                            placeholder="Nome da Vantagem/Defeito..."
                            value={adv.nome}
                            onChange={(e) => handleUpdateAdvantage(adv.id, "nome", e.target.value)}
                            className="h-8 text-xs bg-background flex-1"
                          />

                          {adv.isHomebrew && (
                            <span className="text-[9px] font-bold text-purple-400 bg-purple-950/40 border border-purple-500/40 px-1.5 py-0.5 rounded whitespace-nowrap">
                              Homebrew
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
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
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Seção 4: Convicções & Pilares (Convictions & Touchstones V5) */}
            <div className="border-t border-border/60 pt-4">
              <Accordion type="single" collapsible className="border border-border/50 rounded-lg px-3 bg-muted/10">
                <AccordionItem value="convictions" className="border-none">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-serif text-primary">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Convicções & Pilares (Convictions & Touchstones V5)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Convicções protegem a Humanidade contra Manchas. Cada Convicção deve estar ancorada em um Pilar mortal.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddConviction}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Pilar
                      </Button>
                    </div>

                    {convictions.length === 0 ? (
                      <div className="p-3 border border-dashed border-border rounded-lg text-center bg-muted/10">
                        <p className="text-xs text-muted-foreground">Nenhuma convicção ou pilar cadastrado.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {convictions.map((c) => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-md border space-y-2.5 transition-colors ${c.status === "destroyed"
                              ? "bg-rose-950/20 border-rose-500/50"
                              : c.status === "damaged"
                                ? "bg-amber-950/20 border-amber-500/40"
                                : "bg-surface-container-low border-border/50"
                              }`}
                          >
                            {/* Campo de Convicção Moral */}
                            <div>
                              <Label className="text-[10px] text-muted-foreground font-semibold">Convicção (Moral)</Label>
                              <Input
                                placeholder="Ex: Nunca ferir um inocente..."
                                value={c.conviction}
                                onChange={(e) => handleUpdateConviction(c.id, "conviction", e.target.value)}
                                className="h-7 text-xs bg-background"
                              />
                            </div>

                            {/* Seletor Duplo de Pilar: Selecionar Existente vs Criar Novo NPC */}
                            <div className="p-2 bg-background/60 border border-border/30 rounded space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 font-serif">
                                  <UserCheck className="w-3.5 h-3.5" /> Pilar / Âncora Mortal (NPC)
                                </span>
                                <div className="flex items-center gap-1 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConvictions((prev) =>
                                        prev.map((item) =>
                                          item.id === c.id ? { ...item, touchstone_type: "existing" } : item
                                        )
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded font-semibold transition-colors ${c.touchstone_type !== "new"
                                      ? "bg-primary text-primary-foreground font-bold"
                                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                      }`}
                                  >
                                    Selecionar Existente
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConvictions((prev) =>
                                        prev.map((item) =>
                                          item.id === c.id ? { ...item, touchstone_type: "new" } : item
                                        )
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded font-semibold transition-colors ${c.touchstone_type === "new"
                                      ? "bg-primary text-primary-foreground font-bold"
                                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                                      }`}
                                  >
                                    Criar Novo NPC
                                  </button>
                                </div>
                              </div>

                              {c.touchstone_type !== "new" ? (
                                <div className="space-y-1.5">
                                  <Select
                                    value={c.npc_id || ""}
                                    onValueChange={(npcId) => handleSelectExistingNpcForTouchstone(c.id, npcId)}
                                  >
                                    <SelectTrigger className="h-7 text-xs bg-background font-semibold w-full">
                                      <SelectValue placeholder="Vincular a NPC existente da crônica..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-44">
                                      {(npcs || []).length === 0 ? (
                                        <SelectItem value="none" disabled className="text-xs">
                                          Nenhum NPC cadastrado na crônica
                                        </SelectItem>
                                      ) : (
                                        (npcs || []).map((npc) => (
                                          <SelectItem key={npc.id} value={npc.id} className="text-xs">
                                            👥 {npc.name || npc.nome} ({npc.concept || npc.description || "NPC"})
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Nome do Pilar..."
                                      value={c.touchstone_name}
                                      onChange={(e) => handleUpdateConviction(c.id, "touchstone_name", e.target.value)}
                                      className="h-6 text-[10px] bg-background"
                                    />
                                    <Input
                                      placeholder="Relação / Papel no jogo..."
                                      value={c.touchstone_relation}
                                      onChange={(e) => handleUpdateConviction(c.id, "touchstone_relation", e.target.value)}
                                      className="h-6 text-[10px] bg-background"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2.5 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Nome do NPC *</Label>
                                      <Input
                                        placeholder="Ex: Maria Ramos..."
                                        value={c.touchstone_name}
                                        onChange={(e) => handleUpdateConviction(c.id, "touchstone_name", e.target.value)}
                                        className="h-7 text-xs bg-background"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Cargo / Título</Label>
                                      <Input
                                        placeholder="Ex: Enfermeira Chefe / Contato..."
                                        value={c.touchstone_title || ""}
                                        onChange={(e) => handleUpdateConviction(c.id, "touchstone_title", e.target.value)}
                                        className="h-7 text-xs bg-background"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Categoria / Seita</Label>
                                      <Select
                                        value={c.touchstone_seita || "Mortal"}
                                        onValueChange={(val) => handleUpdateConviction(c.id, "touchstone_seita", val)}
                                      >
                                        <SelectTrigger className="h-7 text-xs bg-background font-semibold">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Mortal" className="text-xs">Mortal</SelectItem>
                                          <SelectItem value="Camarilla" className="text-xs">Camarilla</SelectItem>
                                          <SelectItem value="Anarch" className="text-xs">Anarch</SelectItem>
                                          <SelectItem value="Sabá" className="text-xs">Sabá</SelectItem>
                                          <SelectItem value="Autárquico" className="text-xs">Autárquico</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground font-semibold">Clã / Tipo</Label>
                                      <Select
                                        value={c.touchstone_clan || "Mortal"}
                                        onValueChange={(val) => handleUpdateConviction(c.id, "touchstone_clan", val)}
                                      >
                                        <SelectTrigger className="h-7 text-xs bg-background font-semibold">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-44">
                                          <SelectItem value="Mortal" className="text-xs">Mortal</SelectItem>
                                          <SelectItem value="Ghoul" className="text-xs">Ghoul / Lacaio</SelectItem>
                                          <SelectItem value="Ventrue" className="text-xs">Ventrue</SelectItem>
                                          <SelectItem value="Toreador" className="text-xs">Toreador</SelectItem>
                                          <SelectItem value="Brujah" className="text-xs">Brujah</SelectItem>
                                          <SelectItem value="Nosferatu" className="text-xs">Nosferatu</SelectItem>
                                          <SelectItem value="Malkavian" className="text-xs">Malkavian</SelectItem>
                                          <SelectItem value="Tremere" className="text-xs">Tremere</SelectItem>
                                          <SelectItem value="Gangrel" className="text-xs">Gangrel</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-[10px] text-muted-foreground font-semibold">Breve Descrição / Papel na Vida</Label>
                                    <Input
                                      placeholder="Ex: Irmã mortal que lembra o personagem de sua humanidade perdida..."
                                      value={c.touchstone_relation}
                                      onChange={(e) => handleUpdateConviction(c.id, "touchstone_relation", e.target.value)}
                                      className="h-7 text-xs bg-background"
                                    />
                                  </div>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleCreateNewNpcForTouchstone(
                                        c.id,
                                        c.touchstone_name,
                                        c.touchstone_relation,
                                        c.status || "active",
                                        c.touchstone_seita || "Mortal",
                                        c.touchstone_clan || "Mortal",
                                        c.touchstone_title || "Pilar"
                                      )
                                    }
                                    className="h-7 text-xs bg-background border-amber-500/40 text-amber-300 font-semibold gap-1.5 w-full justify-center"
                                  >
                                    <UserPlus className="w-3.5 h-3.5 text-amber-400" /> Salvar NPC na Galeria & Teia de Intrigas
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Status e Ações */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/30">
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Status de Integridade:
                              </span>

                              <div className="flex items-center gap-2">
                                <Select
                                  value={c.status || "active"}
                                  onValueChange={(val) => handleUpdateConviction(c.id, "status", val)}
                                >
                                  <SelectTrigger className="h-6 text-[10px] bg-background w-32 font-semibold">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active" className="text-[10px] text-emerald-400 font-bold">
                                      Ativo (Protegido)
                                    </SelectItem>
                                    <SelectItem value="damaged" className="text-[10px] text-amber-400 font-bold">
                                      Ferido (+1 Mancha)
                                    </SelectItem>
                                    <SelectItem value="destroyed" className="text-[10px] text-rose-400 font-bold">
                                      Destruído (+2 Manchas)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveConviction(c.id)}
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
              {isEditing && onDelete && !isReadOnly ? (
                <Button type="button" variant="destructive" size="sm" onClick={() => { onDelete(player.id); onOpenChange(false); }}>
                  <Trash2 className="w-4 h-4 mr-1" /> Excluir
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {isReadOnly ? "Fechar" : "Cancelar"}
                </Button>
                {!isReadOnly ? (
                  <Button type="submit">Salvar</Button>
                ) : (
                  <Button type="button" disabled variant="secondary" className="gap-1.5 opacity-70 cursor-not-allowed border border-amber-800/40 bg-amber-950/20 text-amber-300">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Ficha Trancada
                  </Button>
                )}
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
        className={`h-6 text-[10px] bg-background flex-1 ${isMissingInnate
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
