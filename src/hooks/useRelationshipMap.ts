import { useMemo } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Node, Edge } from "@xyflow/react";

// Constantes de Layout Orgânico
const CENTER_X = 500;
const CENTER_Y = 400;

/** Distribui nós ao redor de um ponto central com jitter orgânico */
function radialPosition(cx: number, cy: number, radius: number, index: number, total: number, jitter = 30): { x: number; y: number } {
  const angle = (index / Math.max(1, total)) * 2 * Math.PI - Math.PI / 2;
  const j = (Math.sin(index * 137.508) * jitter); // golden-angle jitter para aspecto orgânico
  return {
    x: Math.round(cx + Math.cos(angle) * (radius + j)),
    y: Math.round(cy + Math.sin(angle) * (radius + j)),
  };
}

/** Distribui touchstones ao redor do seu vampiro dono */
function satellitePosition(parentX: number, parentY: number, index: number, total: number): { x: number; y: number } {
  const radius = 170 + total * 10;
  const spread = Math.min(Math.PI * 0.8, Math.PI / Math.max(1, total - 1));
  const baseAngle = -Math.PI / 2; // começa por cima
  const angle = total === 1 ? baseAngle : baseAngle - spread / 2 + (index / (total - 1)) * spread;
  return {
    x: Math.round(parentX + Math.cos(angle) * radius),
    y: Math.round(parentY + Math.sin(angle) * radius),
  };
}

/** Estiliza uma aresta conforme o tipo de vínculo V5 */
function getEdgeStyle(relationType: string): { stroke: string; strokeDasharray?: string; animated: boolean; strokeWidth: number } {
  switch (relationType) {
    case "BloodBond":
      return { stroke: "#ef4444", animated: true, strokeWidth: 3 };
    case "Enemy":
      return { stroke: "#f43f5e", animated: false, strokeWidth: 2 };
    case "Boon":
    case "Sire":
      return { stroke: "#eab308", strokeDasharray: "4,4", animated: true, strokeWidth: 2 };
    case "Touchstone":
      return { stroke: "#3b82f6", strokeDasharray: "6,4", animated: false, strokeWidth: 2 };
    default:
      return { stroke: "#6b7280", animated: false, strokeWidth: 1.5 };
  }
}

export function useRelationshipMap(mode: "coterie" | "global") {
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

    // ── NÓ CENTRAL DA COTERIE ──
    nodes.push({
      id: "coterie_center",
      position: { x: CENTER_X, y: CENTER_Y },
      data: {
        label: "A COTERIE",
        type: "coterie",
        image: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=400&auto=format&fit=crop",
        memberCount: safePlayers.length,
      },
      type: "coterieNode",
    });

    // ── JOGADORES (VAMPIROS) ──
    const playerPositions: Record<string, { x: number; y: number }> = {};
    const playerRadius = 280 + safePlayers.length * 20;

    safePlayers.forEach((p, idx) => {
      const playerId = p.id || `player_${idx}`;
      const pos = radialPosition(CENTER_X, CENTER_Y, playerRadius, idx, safePlayers.length);
      playerPositions[playerId] = pos;

      nodes.push({
        id: playerId,
        position: pos,
        data: {
          label: p.character_name || p.name || "Vampiro",
          image: p.avatar_url || p.image_url,
          clan: p.clan,
          humanity: p.humanity ?? 7,
          type: "vampire",
          faction: p.clan,
          status: p.status,
        },
        type: "vampireNode",
      });

      // Aresta: Membro da Coterie
      edges.push({
        id: `edge_coterie_${playerId}`,
        source: "coterie_center",
        target: playerId,
        label: p.clan || "Membro",
        style: { stroke: "#b91c1c", strokeWidth: 2 },
        type: "smoothstep",
      });

      // ── TOUCHSTONES / PILARES DO JOGADOR ──
      const playerConvictions = Array.isArray(p.convictions) ? p.convictions.filter(Boolean) : [];
      playerConvictions.forEach((c: any, cIdx: number) => {
        const touchstoneId = c.npc_id || `touchstone_${playerId}_${c.id || cIdx}`;
        const touchstoneName = c.touchstone_name || c.pilar_nome || "Pilar Mortal";

        if (!nodes.some((n) => n.id === touchstoneId)) {
          const tPos = satellitePosition(pos.x, pos.y, cIdx, playerConvictions.length);
          nodes.push({
            id: touchstoneId,
            position: tPos,
            data: {
              label: touchstoneName,
              role: c.touchstone_title || c.touchstone_relation || "Pilar de Humanidade",
              status: c.status || "active",
              type: "touchstone",
              faction: "Mortal",
            },
            type: "touchstoneNode",
          });
        }

        edges.push({
          id: `edge_ts_${playerId}_${touchstoneId}`,
          source: playerId,
          target: touchstoneId,
          label: c.conviction ? `Pilar: ${c.conviction}` : "Pilar",
          ...getEdgeStyle("Touchstone"),
          style: { ...getEdgeStyle("Touchstone") },
          type: "smoothstep",
        });
      });
    });

    // ── MODO GLOBAL: NPCs + RELAÇÕES + BOONS ──
    if (mode === "global") {
      const globalRadius = 580 + safeNpcs.length * 8;
      safeNpcs.forEach((npc, idx) => {
        const npcId = npc.id || `npc_${idx}`;
        if (nodes.some((n) => n.id === npcId)) return;

        const pos = radialPosition(CENTER_X, CENTER_Y, globalRadius, idx, safeNpcs.length, 50);
        nodes.push({
          id: npcId,
          position: pos,
          data: {
            label: npc.name || npc.nome || "NPC",
            role: npc.role || npc.cargo || npc.title,
            sect: npc.category || npc.seita,
            status: npc.status,
            image: npc.image_url || npc.avatar_url,
            type: npc.is_touchstone ? "touchstone" : "npc",
            faction: npc.category || npc.seita || "Mortal",
          },
          type: npc.is_touchstone ? "touchstoneNode" : "npcNode",
        });
      });

      // Relacionamentos persistidos
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
          type: "smoothstep",
        });
      });

      // Boons / Dívidas
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
          type: "smoothstep",
        });
      });
    }

    return { nodes, edges };
  }, [players, npcs, relMap, boons, mode]);

  // Expor setRelMap para persistir novas conexões criadas pelo Narrador
  return { ...result, setRelMap };
}
