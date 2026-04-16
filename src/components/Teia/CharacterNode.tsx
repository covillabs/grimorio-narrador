import { Handle, Position } from '@xyflow/react';

export function CharacterNode({ data }: { data: any }) {
  // Determine border color based on faction or type
  const getBorderColor = () => {
    if (data.type === 'coterie') return 'border-primary shadow-[0_0_15px_rgba(255,0,0,0.4)]';
    if (data.faction === 'Camarilla') return 'border-gold/50 shadow-[0_0_10px_rgba(200,160,50,0.3)]';
    if (data.faction === 'Anarch') return 'border-orange-500/50 shadow-[0_0_10px_rgba(255,100,0,0.3)]';
    return 'border-border';
  };

  return (
    <div className={`relative flex flex-col items-center group transition-transform hover:-translate-y-1`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className={`w-20 h-20 bg-card rounded-md border-2 ${getBorderColor()} overflow-hidden`}>
        <img 
          src={data.image} 
          alt={data.label}
          className={`w-full h-full object-cover transition-all ${data.type === 'npc' ? 'grayscale contrast-125 hover:grayscale-0' : ''}`}
        />
      </div>
      
      <span className={`mt-2 px-2 py-1 bg-background/90 font-serif text-[10px] tracking-widest uppercase border border-border/50 rounded shadow whitespace-nowrap
        ${data.type === 'coterie' ? 'text-primary font-bold' : 'text-foreground/80'}`}>
        {data.label}
      </span>
      {data.status && (
         <span className="text-[8px] uppercase text-blood font-bold tracking-tight absolute -bottom-5">{data.status}</span>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="targetLeft" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="targetRight" className="opacity-0" />
    </div>
  );
}
