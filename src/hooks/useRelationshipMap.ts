import { useCloudStorage } from "@/hooks/useCloudStorage";
import { Node, Edge } from "@xyflow/react";

export function useRelationshipMap(mode: "coterie" | "global") {
  const [players] = useCloudStorage<any[]>("v5_coterie", []);
  const [npcs] = useCloudStorage<any[]>("v5_npcs", []);
  const [relMap] = useCloudStorage<any[]>("v5_relationship_map", []);
  const [boons] = useCloudStorage<any[]>("v5_boons", []);

  const safePlayers = Array.isArray(players) ? players : [];
  const safeNpcs = Array.isArray(npcs) ? npcs : [];
  const safeRelMap = Array.isArray(relMap) ? relMap : [];
  const safeBoons = Array.isArray(boons) ? boons : [];

  let nodes: Node[] = [];
  let edges: Edge[] = [];

  // Nó Central da Coterie
  const centerNode: Node = {
    id: "coterie_center",
    position: { x: 400, y: 300 },
    data: {
      label: "A COTERIE",
      type: "coterie",
      image: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=400&auto=format&fit=crop",
    },
    type: "character",
  };

  nodes.push(centerNode);

  // Mapeamento Radial de Personagens dos Jogadores (Coterie)
  const totalPlayers = safePlayers.length;
  const playerRadius = 240;

  safePlayers.forEach((p, idx) => {
    if (!p || !p.id) return;
    const angle = (idx / Math.max(1, totalPlayers)) * 2 * Math.PI - Math.PI / 2;
    const px = 400 + Math.cos(angle) * playerRadius;
    const py = 300 + Math.sin(angle) * playerRadius;

    nodes.push({
      id: p.id,
      position: { x: px, y: py },
      data: {
        label: p.character_name || p.name || "Vampiro",
        image: p.avatar_url || p.image_url,
        clan: p.clan,
        humanity: p.humanity,
        type: "vampire",
        faction: p.clan,
        status: p.status,
      },
      type: "character",
    });

    // Aresta de Pertencimento à Coterie
    edges.push({
      id: `edge_coterie_${p.id}`,
      source: "coterie_center",
      target: p.id,
      label: "Membro da Coterie",
      style: { stroke: "#b91c1c", strokeWidth: 2.5 },
    });

    // Mapeamento dos Pilares (Touchstones) da Ficha do Jogador
    const playerConvictions = Array.isArray(p.convictions) ? p.convictions : [];
    playerConvictions.forEach((c: any, cIdx: number) => {
      if (!c) return;
      const touchstoneId = c.npc_id || `touchstone_${p.id}_${c.id || cIdx}`;
      const touchstoneName = c.touchstone_name || c.pilar_nome || "Pilar Mortal";

      const alreadyInNodes = nodes.some((n) => n.id === touchstoneId);
      if (!alreadyInNodes) {
        const touchstoneAngle = angle + (cIdx - (playerConvictions.length - 1) / 2) * 0.4;
        const tx = px + Math.cos(touchstoneAngle) * 160;
        const ty = py + Math.sin(touchstoneAngle) * 160;

        nodes.push({
          id: touchstoneId,
          position: { x: tx, y: ty },
          data: {
            label: touchstoneName,
            role: c.touchstone_title || c.touchstone_relation || "Pilar de Humanidade",
            status: c.status || "active",
            type: "touchstone",
            faction: "Mortal",
          },
          type: "character",
        });
      }

      // Aresta Oficial V5: Aliado / Pilar (Linha Azul Tracejada)
      edges.push({
        id: `edge_touchstone_${p.id}_${touchstoneId}`,
        source: p.id,
        target: touchstoneId,
        label: `Pilar: ${c.conviction || "Humanidade"}`,
        style: { stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "5,5" },
        animated: true,
      });
    });
  });

  if (mode === "global") {
    // Adiciona todos os NPCs da Galeria (v5_npcs) que ainda não estão no grafo
    const totalNpcs = safeNpcs.length;
    const globalRadius = 480;

    safeNpcs.forEach((npc, idx) => {
      if (!npc || !npc.id) return;
      const alreadyInNodes = nodes.some((n) => n.id === npc.id);
      if (!alreadyInNodes) {
        const angle = (idx / Math.max(1, totalNpcs)) * 2 * Math.PI;
        const nx = 400 + Math.cos(angle) * globalRadius;
        const ny = 300 + Math.sin(angle) * globalRadius;

        nodes.push({
          id: npc.id,
          position: { x: nx, y: ny },
          data: {
            label: npc.name || npc.nome || "NPC",
            role: npc.role || npc.cargo || npc.title || "NPC",
            sect: npc.category || npc.seita || "Mortal",
            status: npc.status,
            image: npc.image_url || npc.avatar_url,
            is_touchstone: npc.is_touchstone,
            type: npc.is_touchstone ? "touchstone" : "npc",
            faction: npc.category || npc.seita || "Mortal",
          },
          type: "character",
        });
      }
    });

    // Processa Relacionamentos da Tabela v5_relationship_map
    safeRelMap.forEach((rel) => {
      if (!rel || !rel.source_id || !rel.target_id) return;

      let strokeColor = "#3b82f6";
      let dashArray: string | undefined = undefined;
      let isAnimated = false;

      if (rel.relation_type === "BloodBond" || rel.type === "bloodbond") {
        strokeColor = "#ef4444";
        isAnimated = true;
      } else if (rel.relation_type === "Enemy" || rel.type === "rival") {
        strokeColor = "#f43f5e";
      } else if (rel.relation_type === "Boon" || rel.type === "boon") {
        strokeColor = "#eab308";
        dashArray = "3,3";
        isAnimated = true;
      } else if (rel.relation_type === "Touchstone") {
        strokeColor = "#3b82f6";
        dashArray = "5,5";
      }

      edges.push({
        id: `rel_${rel.id || rel.source_id + "_" + rel.target_id}`,
        source: rel.source_id,
        target: rel.target_id,
        label: rel.label || rel.relation_type || "Vínculo",
        animated: isAnimated,
        style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray: dashArray },
      });
    });

    // Processa Favores e Dívidas de Sangue (v5_boons)
    safeBoons.forEach((boon) => {
      if (!boon || boon.isResolved) return;

      const fromNode = nodes.find((n) => n.data.label.toLowerCase() === (boon.from || "").toLowerCase());
      const toNode = nodes.find((n) => n.data.label.toLowerCase() === (boon.to || "").toLowerCase());

      if (fromNode && toNode) {
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
          style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray: "3,3" },
        });
      }
    });
  }

  return { nodes, edges };
}
