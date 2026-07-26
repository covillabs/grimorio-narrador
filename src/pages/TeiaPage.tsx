import { useState, useCallback, useMemo } from 'react';
import { Network, Users, Link2, Eye, Crown, Flame, Heart, ScrollText, Layers } from 'lucide-react';
import { ReactFlow, Controls, Background, MiniMap, Connection, NodeChange, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CoterieNode, VampireNode, TouchstoneNode, NpcNode } from '@/components/Teia/CharacterNode';
import { ConnectionModal, ConnectionParams } from '@/components/Teia/ConnectionModal';
import { Button } from '@/components/ui/button';
import { useRelationshipMap } from '@/hooks/useRelationshipMap';
import { toast } from 'sonner';

const nodeTypes = {
  coterieNode: CoterieNode,
  vampireNode: VampireNode,
  touchstoneNode: TouchstoneNode,
  npcNode: NpcNode,
};

const defaultEdgeOptions = {
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 6,
  labelStyle: { fill: '#e0e0e0', fontSize: 9, fontWeight: 600, fontFamily: 'serif' },
  labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.85, stroke: '#333', strokeWidth: 0.5 },
};

type FilterKey = 'all' | 'camarilla' | 'anarch' | 'pilares' | 'boons' | 'coterie';

const FILTERS: { key: FilterKey; label: string; icon: any; color: string }[] = [
  { key: 'all', label: 'Todos', icon: Layers, color: 'text-foreground' },
  { key: 'coterie', label: 'Coterie', icon: Users, color: 'text-red-400' },
  { key: 'camarilla', label: 'Camarilla', icon: Crown, color: 'text-amber-400' },
  { key: 'anarch', label: 'Anarch', icon: Flame, color: 'text-orange-400' },
  { key: 'pilares', label: 'Pilares', icon: Heart, color: 'text-blue-400' },
  { key: 'boons', label: 'Dívidas', icon: ScrollText, color: 'text-yellow-400' },
];

export default function TeiaPage() {
  const [mode, setMode] = useState<'coterie' | 'global'>('coterie');
  const { nodes, edges, setRelMap } = useRelationshipMap(mode);

  // ── FILTROS ──
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // ── MODO FOCO (clicar num nó para destacar conexões) ──
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // ── DRAG-TO-CONNECT ──
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<ConnectionParams | null>(null);

  // ── POSIÇÕES MANUAIS (arrastar nós) ──
  const [posOverrides, setPosOverrides] = useState<Record<string, { x: number; y: number }>>({});

  // Calcula quais nós estão "ativos" (visíveis/em foco) vs "esmaecidos"
  const { displayNodes, displayEdges } = useMemo(() => {
    // IDs dos nós conectados ao nó em foco
    let focusedConnectedIds: Set<string> | null = null;
    if (focusedNodeId) {
      focusedConnectedIds = new Set([focusedNodeId]);
      edges.forEach((e) => {
        if (e.source === focusedNodeId) focusedConnectedIds!.add(e.target);
        if (e.target === focusedNodeId) focusedConnectedIds!.add(e.source);
      });
    }

    // Função que determina se um nó "passa" no filtro ativo
    const matchesFilter = (n: Node): boolean => {
      if (activeFilter === 'all') return true;
      const faction = ((n.data.faction as string) || '').toLowerCase();
      const type = (n.data.type as string) || '';
      switch (activeFilter) {
        case 'coterie': return type === 'coterie' || type === 'vampire' || faction === 'coterie';
        case 'camarilla': return faction.includes('camarilla');
        case 'anarch': return faction.includes('anarch');
        case 'pilares': return type === 'touchstone' || faction === 'mortal';
        case 'boons': return true; // arestas de boon são filtradas separadamente
        default: return true;
      }
    };

    // Aplica filtro + foco aos nós
    const dNodes = nodes.map((n) => {
      const override = posOverrides[n.id];
      const base = override ? { ...n, position: override } : n;

      const passesFilter = matchesFilter(n);
      const passedFocus = !focusedConnectedIds || focusedConnectedIds.has(n.id);
      const isActive = passesFilter && passedFocus;

      return {
        ...base,
        style: {
          ...base.style,
          opacity: isActive ? 1 : 0.15,
          transition: 'opacity 0.3s ease',
          pointerEvents: isActive ? 'all' as const : 'none' as const,
        },
      };
    });

    // Aplica filtro + foco às arestas
    const activeNodeIds = new Set(dNodes.filter((n) => (n.style?.opacity ?? 1) > 0.5).map((n) => n.id));
    const dEdges = edges.map((e) => {
      const sourceActive = activeNodeIds.has(e.source);
      const targetActive = activeNodeIds.has(e.target);
      let isActive = sourceActive && targetActive;

      // Filtro especial: "Dívidas" destaca apenas arestas de boon
      if (activeFilter === 'boons') {
        const relType = (e.data?.relationType as string) || '';
        isActive = relType === 'Boon' || relType === 'Sire';
        // No modo boons, mostra nós conectados a boons
      }

      return {
        ...e,
        style: {
          ...e.style,
          opacity: isActive ? 1 : 0.08,
          transition: 'opacity 0.3s ease',
        },
        animated: isActive ? e.animated : false,
      };
    });

    // Se filtro é "boons", reativa os nós nas pontas de boon edges
    if (activeFilter === 'boons') {
      const boonNodeIds = new Set<string>();
      dEdges.forEach((e) => {
        if ((e.style?.opacity ?? 0) > 0.5) {
          boonNodeIds.add(e.source);
          boonNodeIds.add(e.target);
        }
      });
      dNodes.forEach((n) => {
        if (boonNodeIds.has(n.id)) {
          n.style = { ...n.style, opacity: 1, pointerEvents: 'all' as const };
        }
      });
    }

    return { displayNodes: dNodes, displayEdges: dEdges };
  }, [nodes, edges, activeFilter, focusedNodeId, posOverrides]);

  // ── HANDLERS ──
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.id) {
        setPosOverrides((prev) => ({ ...prev, [change.id]: change.position! }));
      }
    });
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setFocusedNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onPaneClick = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;

    setPendingConnection({
      sourceId: connection.source,
      targetId: connection.target,
      sourceName: sourceNode.data.label as string,
      targetName: targetNode.data.label as string,
    });
    setConnectionModalOpen(true);
  }, [nodes]);

  const handleConfirmConnection = useCallback((relationType: string, label: string) => {
    if (!pendingConnection) return;
    const newRel = {
      id: crypto.randomUUID(),
      source_id: pendingConnection.sourceId,
      source_name: pendingConnection.sourceName,
      target_id: pendingConnection.targetId,
      target_name: pendingConnection.targetName,
      relation_type: relationType,
      label,
      status: "active",
    };
    setRelMap((prev: any[]) => [...(prev || []), newRel]);
    toast.success(`Vínculo "${label}" criado entre ${pendingConnection.sourceName} e ${pendingConnection.targetName}!`);
    setPendingConnection(null);
  }, [pendingConnection, setRelMap]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Teia de Intrigas</h1>
            <p className="text-muted-foreground text-xs">
              {focusedNodeId ? '🔍 Modo Foco — clique no canvas para limpar' : 'Arraste conexões entre nós • Clique para focar'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filtros Rápidos */}
          {mode === 'global' && (
            <div className="flex bg-card/50 rounded-md p-0.5 border border-border/50 gap-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setActiveFilter(f.key); setFocusedNodeId(null); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeFilter === f.key
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'text-muted-foreground hover:bg-muted/30 border border-transparent'
                  }`}
                >
                  <f.icon className={`w-3 h-3 ${activeFilter === f.key ? 'text-primary' : f.color}`} />
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Alternador de Modo */}
          <div className="flex bg-surface-container-high rounded-md p-0.5 border border-border">
            <Button 
              variant={mode === 'coterie' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setMode('coterie'); setPosOverrides({}); setActiveFilter('all'); setFocusedNodeId(null); }}
              className={`gap-1.5 text-xs ${mode === 'coterie' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Coterie
            </Button>
            <Button 
              variant={mode === 'global' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setMode('global'); setPosOverrides({}); setActiveFilter('all'); setFocusedNodeId(null); }}
              className={`gap-1.5 text-xs ${mode === 'global' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
            >
              <Network className="w-3.5 h-3.5" />
              Domínio
            </Button>
          </div>
        </div>
      </div>
      
      {/* ── CANVAS ── */}
      <div className="flex-1 w-full border border-border rounded-lg overflow-hidden relative bg-black/50">
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          connectionLineStyle={{ stroke: '#b91c1c', strokeWidth: 2, strokeDasharray: '6,3' }}
        >
          <Background color="#3a2a28" gap={50} size={1} />
          <Controls className="bg-background/90 border-border text-foreground rounded-lg shadow-xl" showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const opacity = (n.style?.opacity as number) ?? 1;
              if (opacity < 0.5) return '#222';
              if (n.type === 'coterieNode') return '#b91c1c';
              if (n.type === 'vampireNode') return '#ef4444';
              if (n.type === 'touchstoneNode') return '#3b82f6';
              const faction = ((n.data?.faction as string) || '').toLowerCase();
              if (faction.includes('camarilla')) return '#eab308';
              if (faction.includes('anarch')) return '#f97316';
              return '#6b7280';
            }}
            className="bg-background/80 border-border rounded-lg"
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>

        {/* ── LEGENDA ── */}
        <div className="absolute bottom-3 left-3 z-20 bg-background/90 backdrop-blur-md p-3 border-l-2 border-primary rounded-r shadow-xl pointer-events-none">
          <h3 className="font-serif font-bold text-[10px] mb-2 text-foreground/80 flex items-center gap-1">
            <Link2 className="w-3 h-3 text-primary" /> Vinculum V5
          </h3>
          <div className="space-y-1 text-[9px] uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[3px] bg-red-600 rounded shadow-[0_0_3px_rgba(220,38,38,0.6)]"></div>
              <span>Laço de Sangue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[2px] bg-rose-500 rounded"></div>
              <span>Rivalidade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 border-b-[2px] border-dashed border-blue-500"></div>
              <span>Pilar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 border-b-[2px] border-dotted border-amber-400"></div>
              <span>Dívida / Sire</span>
            </div>
          </div>
        </div>

        {/* ── INDICADOR DE FOCO ── */}
        {focusedNodeId && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/40 shadow-lg">
            <span className="text-[11px] text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Modo Foco — clique no canvas para sair
            </span>
          </div>
        )}
      </div>

      {/* ── MODAL DE CONEXÃO ── */}
      <ConnectionModal
        open={connectionModalOpen}
        onClose={() => { setConnectionModalOpen(false); setPendingConnection(null); }}
        params={pendingConnection}
        onConfirm={handleConfirmConnection}
      />
    </div>
  );
}
