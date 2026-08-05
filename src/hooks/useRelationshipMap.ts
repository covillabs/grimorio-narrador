import { useMemo } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Node, Edge } from "@xyflow/react";
import { RELATION_STYLE_MAP, type RelationType, type NodePositionMap } from "@/types/intrigas";

// ═══════════════════════════════════════════════════════════
// ZONAS GEOPOLÍTICAS DO DOMÍNIO V5
// Cada zona é um centro gravitacional para seus nós
// ═══════════════════════════════════════════════════════════

const ZONES = {
  coterie:   { cx: 600, cy: 450, label: "A Coterie" },
  camarilla: { cx: 100, cy: 100, label: "Camarilla" },
  anarch:    { cx: 1100, cy: 100, label: "Movimento Anarch" },
  sabbat:    { cx: 1100, cy: 750, label: "Sabá" },
  mortal:    { cx: 100, cy: 750, label: "Mortais & Pilares" },
  independente: { cx: 600, cy: 900, label: "Independentes & Autárquicos" },
};

type ZoneKey = keyof typeof ZONES;

/** Detecta a zona de um NPC com base na sua facção/categoria */
function detectZone(faction: string): ZoneKey {
  const f = (faction || "").toLowerCase();
  if (f.includes("camarilla")) return "camarilla";
  if (f.includes("anarch")) return "anarch";
  if (f.includes("sabbat") || f.includes("sabá")) return "sabbat";
  if (f.includes("mortal") || f.includes("humano") || f.includes("ghoul")) return "mortal";
  if (f.includes("independ") || f.includes("autárquico") || f.includes("autarquico")) return "independente";
  return "independente";
}

/** Distribui nós ao redor de um ponto central em cluster orgânico */
function clusterPosition(cx: number, cy: number, index: number, total: number, radius = 160, jitter = 25): { x: number; y: number } {
  if (total <= 1) return { x: cx, y: cy };
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const j = Math.sin(index * 137.508) * jitter;
  return {
    x: Math.round(cx + Math.cos(angle) * (radius + j)),
    y: Math.round(cy + Math.sin(angle) * (radius + j)),
  };
}

/** Distribui touchstones em satélite ao redor do seu vampiro */
function satellitePosition(px: number, py: number, index: number, total: number): { x: number; y: number } {
  const radius = 150;
  const spread = Math.min(Math.PI * 0.8, Math.PI / Math.max(1, total - 1));
  const base = -Math.PI / 2;
  const angle = total === 1 ? base : base - spread / 2 + (index / (total - 1)) * spread;
  return {
    x: Math.round(px + Math.cos(angle) * radius),
    y: Math.round(py + Math.sin(angle) * radius),
  };
}

/** Estiliza aresta conforme tipo de vínculo V5 (usa RELATION_STYLE_MAP) */
function getEdgeStyle(type: string) {
  const config = RELATION_STYLE_MAP[type as RelationType] || RELATION_STYLE_MAP.Custom;
  return {
    stroke: config.stroke,
    animated: config.animated,
    strokeWidth: config.strokeWidth,
    strokeDasharray: config.strokeDasharray,
  };
}

export function useRelationshipMap(mode: "coterie" | "global", posOverrides?: NodePositionMap) {
  const [players] = useCloudStorage<any[]>("v5_coterie", []);
  const [npcs] = useCloudStorage<any[]>("v5_npcs", []);
  const [relMap, setRelMap] = useCloudStorage<any[]>("v5_relationship_map", []);
  const [boons] = useCloudStorage<any[]>("v5_boons", []);

  const result = useMemo(() => {
    const safePlayers = Array.isArray(players) ? players.filter((p) => p && (p.id || p.character_name || p.name)) : [];
    const safeNpcs = Array.isArray(npcs) ? npcs.filter((n) => n && (n.id || n.name || n.nome)) : [];
    const safeRelMap = Array.isArray(relMap) ? relMap : [];
    const safeBoons = Array.isArray(boons) ? boons : [];

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const { cx, cy } = ZONES.coterie;

    // ── NÓ CENTRAL DA COTERIE ──
    nodes.push({
      id: "coterie_center",
      position: { x: cx, y: cy },
      data: { label: "A COTERIE", type: "coterie", memberCount: safePlayers.length, image: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=400&auto=format&fit=crop", faction: "Coterie" },
      type: "coterieNode",
    });

    // ── JOGADORES ──
    const playerRadius = 220 + safePlayers.length * 15;
    safePlayers.forEach((p, idx) => {
      const playerId = p.id || `player_${idx}`;
      const pos = clusterPosition(cx, cy, idx, safePlayers.length, playerRadius, 20);

      nodes.push({
        id: playerId,
        position: pos,
        data: {
          label: p.character_name || p.name || "Vampiro",
          image: p.avatar_url || p.image_url,
          clan: p.clan,
          humanity: p.humanity ?? 7,
          type: "vampire",
          faction: "Coterie",
          status: p.status,
        },
        type: "vampireNode",
      });

      edges.push({
        id: `edge_coterie_${playerId}`,
        source: "coterie_center",
        target: playerId,
        label: p.clan || "Membro",
        style: { stroke: "#b91c1c", strokeWidth: 2 },
        type: "relationshipEdge",
        data: { relationType: "Coterie" },
      });

      // ── TOUCHSTONES ──
      const convictions = Array.isArray(p.convictions) ? p.convictions.filter(Boolean) : [];
      convictions.forEach((c: any, cIdx: number) => {
        const tsId = c.npc_id || `ts_${playerId}_${c.id || cIdx}`;
        const tsName = c.touchstone_name || c.pilar_nome || "Pilar Mortal";

        if (!nodes.some((n) => n.id === tsId)) {
          const tPos = satellitePosition(pos.x, pos.y, cIdx, convictions.length);
          nodes.push({
            id: tsId,
            position: tPos,
            data: {
              label: tsName,
              role: c.touchstone_title || c.touchstone_relation || "Pilar de Humanidade",
              status: c.status || "active",
              type: "touchstone",
              faction: "Mortal",
            },
            type: "touchstoneNode",
          });
        }

        edges.push({
          id: `edge_ts_${playerId}_${tsId}`,
          source: playerId,
          target: tsId,
          label: c.conviction ? `Pilar: ${c.conviction}` : "Pilar",
          animated: getEdgeStyle("Touchstone").animated,
          style: { stroke: getEdgeStyle("Touchstone").stroke, strokeWidth: getEdgeStyle("Touchstone").strokeWidth, strokeDasharray: getEdgeStyle("Touchstone").strokeDasharray },
          type: "relationshipEdge",
          data: { relationType: "Touchstone" },
        });
      });
    });

    // ── MODO GLOBAL: NPCs POR ZONA GEOPOLÍTICA ──
    if (mode === "global") {
      // Agrupa NPCs por zona
      const zoneGroups: Record<ZoneKey, any[]> = {
        coterie: [], camarilla: [], anarch: [], sabbat: [], mortal: [], independente: [],
      };
      safeNpcs.forEach((npc) => {
        if (nodes.some((n) => n.id === npc.id)) return; // já está como touchstone
        const faction = npc.category || npc.seita || npc.species_faction || "Mortal";
        const zone = detectZone(faction);
        zoneGroups[zone].push(npc);
      });

      // Renderiza nós de zona (rótulo visual)
      (Object.keys(zoneGroups) as ZoneKey[]).forEach((zk) => {
        if (zk === "coterie") return; // já temos o nó central
        const group = zoneGroups[zk];
        if (group.length === 0) return;

        const zone = ZONES[zk];
        // Nó invisível de rótulo de zona
        nodes.push({
          id: `zone_label_${zk}`,
          position: { x: zone.cx - 60, y: zone.cy - 60 },
          data: { label: zone.label, type: "zone_label", faction: zk },
          type: "npcNode",
          selectable: false,
          draggable: false,
        });

        group.forEach((npc: any, idx: number) => {
          const npcId = npc.id || `npc_${zk}_${idx}`;
          const pos = clusterPosition(zone.cx, zone.cy, idx, group.length, 120 + group.length * 8, 20);
          const faction = npc.category || npc.seita || zk;

          nodes.push({
            id: npcId,
            position: pos,
            data: {
              label: npc.name || npc.nome || "NPC",
              role: npc.role || npc.cargo || npc.title,
              sect: faction,
              status: npc.status,
              image: npc.image_url || npc.avatar_url,
              type: npc.is_touchstone ? "touchstone" : "npc",
              faction: faction,
            },
            type: npc.is_touchstone ? "touchstoneNode" : "npcNode",
          });
        });
      });

      // ── RELAÇÕES PERSISTIDAS ──
      safeRelMap.forEach((rel) => {
        if (!rel || !rel.source_id || !rel.target_id) return;
        const relType = rel.relation_type || rel.type || "Touchstone";
        const style = getEdgeStyle(relType);
        edges.push({
          id: `rel_${rel.id || rel.source_id + "_" + rel.target_id}`,
          source: rel.source_id,
          target: rel.target_id,
          label: rel.label || relType,
          animated: style.animated,
          style: { stroke: style.stroke, strokeWidth: style.strokeWidth, strokeDasharray: style.strokeDasharray },
          type: "relationshipEdge",
          data: { relationType: relType, description: rel.description || rel.notes || "" },
        });
      });

      // ── BOONS / DÍVIDAS ──
      safeBoons.forEach((boon) => {
        if (!boon || boon.isResolved) return;
        const fromNode = nodes.find((n) => (n.data.label as string).toLowerCase() === (boon.from || "").toLowerCase());
        const toNode = nodes.find((n) => (n.data.label as string).toLowerCase() === (boon.to || "").toLowerCase());
        if (!fromNode || !toNode) return;

        let strokeColor = "#eab308";
        if (boon.type === "minor") strokeColor = "#3b82f6";
        if (boon.type === "trivial") strokeColor = "#9ca3af";
        if (boon.type === "life") strokeColor = "#991b1b";

        edges.push({
          id: `boon_${boon.id}`,
          source: fromNode.id,
          target: toNode.id,
          label: `Dívida: ${boon.description || boon.type}`,
          animated: true,
          style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray: "4,4" },
          type: "relationshipEdge",
          data: { relationType: "Boon", description: boon.description || "" },
        });
      });
    }

    return { nodes, edges };
  }, [players, npcs, relMap, boons, mode]);

  return { ...result, setRelMap };
}
