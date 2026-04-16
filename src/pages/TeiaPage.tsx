import { useState } from 'react';
import { Network, Users } from 'lucide-react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CharacterNode } from '@/components/Teia/CharacterNode';
import { coterieNodes, coterieEdges, globalNodes, globalEdges } from '@/components/Teia/mockData';
import { Button } from '@/components/ui/button';

const nodeTypes = {
  character: CharacterNode,
};

export default function TeiaPage() {
  const [mode, setMode] = useState<'coterie' | 'global'>('coterie');
  
  const [nodes, setNodes, onNodesChange] = useNodesState(coterieNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(coterieEdges);

  const handleModeSwitch = (newMode: 'coterie' | 'global') => {
    setMode(newMode);
    if (newMode === 'coterie') {
      setNodes(coterieNodes);
      setEdges(coterieEdges);
    } else {
      setNodes(globalNodes);
      setEdges(globalEdges);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Teia de Intrigas</h1>
          <p className="text-muted-foreground mt-1">O emaranhado político e social do Domínio</p>
        </div>
        
        <div className="flex bg-surface-container-high rounded-md p-1 border border-border">
          <Button 
            variant={mode === 'coterie' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => handleModeSwitch('coterie')}
            className={`gap-2 ${mode === 'coterie' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          >
            <Users className="w-4 h-4" />
            Modo Coterie
          </Button>
          <Button 
            variant={mode === 'global' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => handleModeSwitch('global')}
            className={`gap-2 ${mode === 'global' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          >
            <Network className="w-4 h-4" />
            Modo Global
          </Button>
        </div>
      </div>
      
      <div className="flex-1 w-full border border-border rounded-lg overflow-hidden relative bg-black/40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none z-0"></div>
        <ReactFlow
          nodes={nodes}
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
          <h3 className="font-serif font-bold text-sm mb-3">Legenda do Vinculum</h3>
          <div className="space-y-2 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blood shadow-[0_0_5px_rgba(255,0,0,0.8)]"></div>
              <span>Laço de Sangue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[#ffb4ab]"></div>
              <span>Rivalidade / Inimigo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-b-2 border-dashed border-[#bcc3ff]"></div>
              <span>Aliado / Pilar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 border-b-2 border-dotted border-gold"></div>
              <span>Dívida (Boon) / Sire</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
