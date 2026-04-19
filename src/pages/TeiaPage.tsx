import { useState, useEffect } from 'react';
import { Network, Users } from 'lucide-react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, Edge, Node } from '@xyflow/react';
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
      // Injetando Boons Dinâmicos no Modo Global
      let dynamicEdges = [...globalEdges];
      let dynamicNodes = [...globalNodes];
      
      try {
        const savedBoons = localStorage.getItem("v5_boons");
        if (savedBoons) {
          const boonsList = JSON.parse(savedBoons);
          
          boonsList.forEach((boon: any) => {
            if (boon.isResolved) return; // Só favores ativos
            
            let fromNode = dynamicNodes.find(n => n.data.label.toLowerCase() === boon.from.toLowerCase());
            let toNode = dynamicNodes.find(n => n.data.label.toLowerCase() === boon.to.toLowerCase());
            
            // Cria nós fantasmas se a pessoa ainda não estiver na teia oficial
            if (!fromNode) {
              const newId = 'dyn_' + Date.now() + Math.random();
              fromNode = { id: newId, position: { x: Math.random() * 800, y: Math.random() * 400 }, data: { label: boon.from, type: 'npc' }, type: 'character' };
              dynamicNodes.push(fromNode);
            }
            if (!toNode) {
              const newId = 'dyn_' + Date.now() + Math.random();
              toNode = { id: newId, position: { x: Math.random() * 800, y: Math.random() * 400 }, data: { label: boon.to, type: 'npc' }, type: 'character' };
              dynamicNodes.push(toNode);
            }
            
            // Cor baseada no tipo
            let strokeColor = '#f59e0b'; // yellow-500
            if (boon.type === 'minor') strokeColor = '#3b82f6';
            if (boon.type === 'trivial') strokeColor = '#9ca3af';
            if (boon.type === 'life') strokeColor = '#991b1b';

            dynamicEdges.push({
              id: `boon_${boon.id}`,
              source: fromNode.id,
              target: toNode.id,
              label: `Dívida: ${boon.description}`,
              animated: true,
              style: { stroke: strokeColor, strokeWidth: 2, strokeDasharray: '4,4' }
            });
          });
        }
      } catch (e) {
        console.error("Erro ao ler Livro de Dívidas na Teia", e);
      }
      
      setNodes(dynamicNodes);
      setEdges(dynamicEdges);
    }
  };

  useEffect(() => {
    // Carrega o modo inicial com os Boons se necessário
    if (mode === 'global') handleModeSwitch('global');
  }, []);

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
