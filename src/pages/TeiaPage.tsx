import { useState, useCallback } from 'react';
import { Network, Users } from 'lucide-react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CharacterNode } from '@/components/Teia/CharacterNode';
import { Button } from '@/components/ui/button';
import { useRelationshipMap } from '@/hooks/useRelationshipMap';

const nodeTypes = {
  character: CharacterNode,
};

export default function TeiaPage() {
  const [mode, setMode] = useState<'coterie' | 'global'>('coterie');
  const { nodes, edges } = useRelationshipMap(mode);

  // Permitir que o usuário arraste os nós (aplicar mudanças de posição em cima dos nós computados)
  const [nodePositionOverrides, setNodePositionOverrides] = useState<Record<string, { x: number; y: number }>>({});

  const displayNodes = nodes.map((n) => {
    const override = nodePositionOverrides[n.id];
    return override ? { ...n, position: override } : n;
  });

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.id) {
        setNodePositionOverrides((prev) => ({
          ...prev,
          [change.id]: change.position!,
        }));
      }
    });
  }, []);

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Noop: arestas são derivadas dos dados
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Teia de Intrigas</h1>
            <p className="text-muted-foreground mt-1 text-sm">O emaranhado político e social do Domínio (Grafo V5 Vivo)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-high rounded-md p-1 border border-border">
            <Button 
              variant={mode === 'coterie' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setMode('coterie'); setNodePositionOverrides({}); }}
              className={`gap-2 ${mode === 'coterie' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
            >
              <Users className="w-4 h-4" />
              Modo Coterie
            </Button>
            <Button 
              variant={mode === 'global' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => { setMode('global'); setNodePositionOverrides({}); }}
              className={`gap-2 ${mode === 'global' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
            >
              <Network className="w-4 h-4" />
              Modo Global
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full border border-border rounded-lg overflow-hidden relative bg-black/40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none z-0"></div>
        <ReactFlow
          nodes={displayNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          className="z-10"
        >
          <Background color="#5a403c" gap={40} size={1} />
          <Controls className="bg-background/80 border-border text-foreground" />
        </ReactFlow>

        <div className="absolute bottom-4 left-4 z-20 bg-background/80 backdrop-blur-md p-4 border-l-2 border-primary rounded-r shadow-xl pointer-events-none">
          <h3 className="font-serif font-bold text-sm mb-3">Legenda do Vinculum V5</h3>
          <div className="space-y-2 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blood shadow-[0_0_5px_rgba(255,0,0,0.8)]"></div>
              <span>Laço de Sangue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-rose-500"></div>
              <span>Rivalidade / Inimigo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-b-2 border-dashed border-blue-500"></div>
              <span>Aliado / Pilar (Touchstone)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-b-2 border-dotted border-amber-400"></div>
              <span>Dívida (Boon) / Criador (Sire)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
