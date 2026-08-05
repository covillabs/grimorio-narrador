// ═══════════════════════════════════════════════════════════
// TIPAGENS DO MÓDULO TEIA DE INTRIGAS
// Vampiro: A Máscara V5 — Grimório Narrador
// ═══════════════════════════════════════════════════════════

/** Tipos de relação disponíveis no sistema V5 */
export type RelationType =
  | "Touchstone"
  | "BloodBond"
  | "Enemy"
  | "Boon"
  | "Sire"
  | "Coterie"
  | "Alliance"
  | "Custom";

/** Facções / Seitas do Mundo das Trevas */
export type FactionType =
  | "Coterie"
  | "Camarilla"
  | "Anarch"
  | "Sabá"
  | "Mortal"
  | "Independente"
  | "Autárquico"
  | "Ghoul";

/** Status de uma entidade no grafo */
export type EntityStatus = "active" | "Ativo" | "damaged" | "Ferido" | "destroyed" | "Morte Final";

/** Tipo visual de nó no ReactFlow */
export type TeiaNodeType = "coterieNode" | "vampireNode" | "touchstoneNode" | "npcNode";

/** Dados internos de um nó no grafo */
export interface TeiaNodeData {
  label: string;
  type: "coterie" | "vampire" | "touchstone" | "npc" | "zone_label";
  faction: string;
  image?: string;
  clan?: string;
  humanity?: number;
  role?: string;
  sect?: string;
  status?: EntityStatus;
  memberCount?: number;
}

/** Dados internos de uma aresta customizada */
export interface TeiaEdgeData {
  relationType: RelationType;
  description?: string;
  notes?: string;
  intensity?: "trivial" | "minor" | "major" | "life";
  createdAt?: string;
}

/** Relação persistida no useCloudStorage (v5_relationship_map) */
export interface PersistedRelation {
  id: string;
  source_id: string;
  source_name: string;
  target_id: string;
  target_name: string;
  relation_type: RelationType;
  label: string;
  description?: string;
  notes?: string;
  status: "active" | "inactive";
  created_at?: string;
}

/** Mapa de posições de nós salvas pelo usuário */
export type NodePositionMap = Record<string, { x: number; y: number }>;

/** Configuração visual de uma aresta por tipo de relação */
export interface EdgeStyleConfig {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated: boolean;
  glowColor?: string;
  icon?: string;
  label: string;
}

/** Mapa de configurações visuais por tipo de relação */
export const RELATION_STYLE_MAP: Record<RelationType, EdgeStyleConfig> = {
  BloodBond: {
    stroke: "#ef4444",
    strokeWidth: 3,
    animated: true,
    glowColor: "rgba(239,68,68,0.6)",
    icon: "🩸",
    label: "Laço de Sangue",
  },
  Enemy: {
    stroke: "#f43f5e",
    strokeWidth: 2.5,
    animated: false,
    glowColor: "rgba(244,63,94,0.4)",
    icon: "⚔️",
    label: "Rivalidade",
  },
  Boon: {
    stroke: "#eab308",
    strokeWidth: 2,
    strokeDasharray: "6,4",
    animated: true,
    glowColor: "rgba(234,179,8,0.4)",
    icon: "📜",
    label: "Dívida (Boon)",
  },
  Sire: {
    stroke: "#a855f7",
    strokeWidth: 2,
    strokeDasharray: "4,4",
    animated: true,
    glowColor: "rgba(168,85,247,0.4)",
    icon: "👑",
    label: "Criador / Sire",
  },
  Touchstone: {
    stroke: "#3b82f6",
    strokeWidth: 2,
    strokeDasharray: "8,4",
    animated: false,
    glowColor: "rgba(59,130,246,0.35)",
    icon: "⚓",
    label: "Pilar",
  },
  Coterie: {
    stroke: "#b91c1c",
    strokeWidth: 2,
    animated: false,
    icon: "🦇",
    label: "Coterie",
  },
  Alliance: {
    stroke: "#22c55e",
    strokeWidth: 2,
    strokeDasharray: "4,3",
    animated: false,
    glowColor: "rgba(34,197,94,0.3)",
    icon: "🤝",
    label: "Aliança",
  },
  Custom: {
    stroke: "#6b7280",
    strokeWidth: 1.5,
    animated: false,
    icon: "🔗",
    label: "Vínculo",
  },
};
