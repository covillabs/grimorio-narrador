import { useState, useCallback } from 'react';
import { Network, Users, Link2 } from 'lucide-react';
import { ReactFlow, Controls, Background, MiniMap, Connection, NodeChange } from '@xyflow/react';
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

const edgeDefaultStyle = {
  labelBgPadding: [6, 3] as [number, number],
  labelBgBorderRadius: 6,
  labelStyle: { fill: '#e0e0e0', fontSize: 9, fontWeight: 600, fontFamily: 'serif' },
  labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.85, stroke: '#333', strokeWidth: 0.5 },
};

export default function TeiaPage() {
  const [mode, setMode] = useState<'coterie' | 'global'>('coterie');
  const { nodes, edges, setRelMap } = useRelationshipMap(mode);

  // Drag-to-Connect: modal de tipo de vínculo
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<ConnectionParams | null>(null);

  // Posições manuais que o narrador arrasta
  const [posOverrides, setPosOverrides] = useState<Record<string, { x: number; y: number }>>({});

  const displayNodes = nodes.map((n) => {
    const override = posOverrides[n.id];
    return override ? { ...n, position: override } : n;
  });

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.id) {
        setPosOverrides((prev) => ({ ...prev, [change.id]: change.position! }));
      }
    });
  }, []);

  // Drag-to-Connect: quando o narrador arrasta uma aresta entre dois nós
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

  // Confirmar o tipo de vínculo e persistir
  const handleConfirmConnection = useCallback((relationType: string, label: string) => {
    if (!pendingConnection) return;

    const newRel = {
      id: crypto.randomUUID(),
      source_id: pendingConnection.sourceId,
      source_name: pendingConnection.sourceName,
      target_id: pendingConnection.targetId,
      target_name: pendingConnection.targetName,
      relation_type: relationType,
      label: label,
      status: "active",
    };

    setRelMap((prev: any[]) => [...(prev || []), newRel]);
    toast.success(`Vínculo "${label}" criado entre ${pendingConnection.sourceName} e ${pendingConnection.targetName}!`);
    setPendingConnection(null);
  }, [pendingConnection, setRelMap]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Teia de Intrigas</h1>
            <p className="text-muted-foreground mt-1 text-sm">Arraste conexões entre nós para criar vínculos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-high rounded-md p-1 border border-border">
            <Button 
              variant={mode === 'coterie' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setMode('coterie'); setPosOverrides({}); }}
              className={`gap-2 ${mode === 'coterie' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
            >
              <Users className="w-4 h-4" />
              Coterie
            </Button>
            <Button 
              variant={mode === 'global' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setMode('global'); setPosOverrides({}); }}
              className={`gap-2 ${mode === 'global' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
            >
              <Network className="w-4 h-4" />
              Domínio
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full border border-border rounded-lg overflow-hidden relative bg-black/50">
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={edgeDefaultStyle}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          connectionLineStyle={{ stroke: '#b91c1c', strokeWidth: 2, strokeDasharray: '6,3' }}
        >
          <Background color="#3a2a28" gap={50} size={1} />
          <Controls 
            className="bg-background/90 border-border text-foreground rounded-lg shadow-xl"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'coterieNode') return '#b91c1c';
              if (n.type === 'vampireNode') return '#ef4444';
              if (n.type === 'touchstoneNode') return '#3b82f6';
              return '#6b7280';
            }}
            className="bg-background/80 border-border rounded-lg"
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>

        {/* Legenda do Vinculum V5 */}
        <div className="absolute bottom-4 left-4 z-20 bg-background/85 backdrop-blur-md p-4 border-l-2 border-primary rounded-r shadow-xl pointer-events-none">
          <h3 className="font-serif font-bold text-xs mb-2.5 text-foreground/90 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-primary" /> Legenda do Vinculum
          </h3>
          <div className="space-y-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-[3px] bg-red-600 rounded shadow-[0_0_4px_rgba(220,38,38,0.6)]"></div>
              <span>Laço de Sangue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-[2px] bg-rose-500 rounded"></div>
              <span>Rivalidade / Inimigo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 border-b-[2px] border-dashed border-blue-500"></div>
              <span>Aliado / Pilar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 border-b-[2px] border-dotted border-amber-400"></div>
              <span>Dívida / Sire</span>
            </div>
          </div>
        </div>

        {/* Dica de arrastar */}
        <div className="absolute top-3 right-3 z-20 bg-background/70 backdrop-blur-sm px-3 py-1.5 rounded-md border border-border/50 pointer-events-none">
          <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-semibold">
            Arraste de um nó a outro para vincular
          </span>
        </div>
      </div>

      {/* Modal de Tipo de Conexão */}
      <ConnectionModal
        open={connectionModalOpen}
        onClose={() => { setConnectionModalOpen(false); setPendingConnection(null); }}
        params={pendingConnection}
        onConfirm={handleConfirmConnection}
      />
    </div>
  );
}
