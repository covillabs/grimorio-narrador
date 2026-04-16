import { Node, Edge } from '@xyflow/react';

// --- SHARED DATA ---
const lucienImg = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";
const vikImg = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop";
const kalebImg = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop";
const princeImg = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";
const baronImg = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop";
const scourgeImg = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=400&auto=format&fit=crop";

export const coterieNodes: Node[] = [
  { id: 'coterie_center', position: { x: 400, y: 300 }, data: { label: 'A COTERIE', type: 'coterie', image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=400&auto=format&fit=crop' }, type: 'character' },
  { id: 'p1', position: { x: 200, y: 150 }, data: { label: 'Lucien', type: 'player', faction: 'Camarilla', image: lucienImg }, type: 'character' },
  { id: 'p2', position: { x: 600, y: 150 }, data: { label: 'Viktoria', type: 'player', faction: 'Camarilla', image: vikImg }, type: 'character' },
  { id: 'p3', position: { x: 400, y: 500 }, data: { label: 'Kaleb', type: 'player', faction: 'Anarch', image: kalebImg }, type: 'character' },
  { id: 'npc1', position: { x: 100, y: -50 }, data: { label: 'Príncipe Sebastian', type: 'npc', faction: 'Camarilla', image: princeImg }, type: 'character' },
  { id: 'npc2', position: { x: 700, y: -50 }, data: { label: 'Barão Zora', type: 'npc', faction: 'Anarch', image: baronImg }, type: 'character' }
];

export const coterieEdges: Edge[] = [
  { id: 'e-coterie-p1', source: 'coterie_center', target: 'p1', animated: true, style: { stroke: '#ffdad4', strokeWidth: 2 } },
  { id: 'e-coterie-p2', source: 'coterie_center', target: 'p2', animated: true, style: { stroke: '#ffdad4', strokeWidth: 2 } },
  { id: 'e-coterie-p3', source: 'coterie_center', target: 'p3', animated: true, style: { stroke: '#ffdad4', strokeWidth: 2 } },
  { id: 'e-p1-npc1', source: 'npc1', target: 'p1', label: 'Blood Bond III', animated: true, style: { stroke: '#8b0000', strokeWidth: 3 }, labelStyle: { fill: '#8b0000', fontWeight: 700 } },
  { id: 'e-p3-npc2', source: 'p3', target: 'npc2', label: 'Ally', style: { stroke: '#bcc3ff', strokeDasharray: '5,5', strokeWidth: 2 } },
];


export const globalNodes: Node[] = [
  { id: 'p1', position: { x: 300, y: 300 }, data: { label: 'Lucien', type: 'player', faction: 'Camarilla', image: lucienImg }, type: 'character' },
  { id: 'p2', position: { x: 500, y: 300 }, data: { label: 'Viktoria', type: 'player', faction: 'Camarilla', image: vikImg }, type: 'character' },
  { id: 'p3', position: { x: 700, y: 300 }, data: { label: 'Kaleb', type: 'player', faction: 'Anarch', image: kalebImg }, type: 'character' },
  { id: 'npc1', position: { x: 400, y: 100 }, data: { label: 'Príncipe Sebastian', type: 'npc', faction: 'Camarilla', image: princeImg }, type: 'character' },
  { id: 'npc2', position: { x: 800, y: 100 }, data: { label: 'Barão Zora', type: 'npc', faction: 'Anarch', image: baronImg }, type: 'character' },
  { id: 'npc3', position: { x: 100, y: 250 }, data: { label: 'O Algoz', type: 'npc', faction: 'Camarilla', image: scourgeImg, status: 'HOSTILE' }, type: 'character' }
];

export const globalEdges: Edge[] = [
  { id: 'e-npc1-p2', source: 'npc1', target: 'p2', label: 'Sire', style: { stroke: '#ffb4a8', strokeWidth: 2 } },
  { id: 'e-npc1-p1', source: 'npc1', target: 'p1', label: 'Blood Bond II', animated: true, style: { stroke: '#8b0000', strokeWidth: 3 }, labelBgStyle: { fill: '#000' }, labelStyle: { fill: '#8b0000', fontWeight: 700 } },
  { id: 'e-npc2-p3', source: 'npc2', target: 'p3', label: 'Life Debt', style: { stroke: '#ffdad4', strokeDasharray: '2,4', strokeWidth: 2 } },
  { id: 'e-p1-p2', source: 'p1', target: 'p2', label: 'Rivals', style: { stroke: '#ffb4ab', strokeWidth: 2 } },
  { id: 'e-npc3-p1', source: 'npc3', target: 'p1', label: 'Hunting', animated: true, style: { stroke: '#ff0000', strokeWidth: 2 } },
];
