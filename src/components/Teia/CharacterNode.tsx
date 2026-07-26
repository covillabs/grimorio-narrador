import { Handle, Position } from '@xyflow/react';
import { Skull, Heart, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

export function CharacterNode({ data }: { data: any }) {
  const isDead = data.status === "Morte Final" || data.status === "destroyed";
  const isDamaged = data.status === "damaged" || data.status === "Ferido";

  // Determine border color based on faction or type
  const getBorderColor = () => {
    if (isDead) return 'border-rose-700/80 shadow-[0_0_10px_rgba(225,29,72,0.6)]';
    if (isDamaged) return 'border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.6)]';
    if (data.type === 'coterie') return 'border-primary shadow-[0_0_15px_rgba(255,0,0,0.4)]';
    if (data.type === 'touchstone') return 'border-blue-500/80 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
    if (data.faction === 'Camarilla' || data.sect === 'Camarilla') return 'border-amber-400/60 shadow-[0_0_10px_rgba(200,160,50,0.3)]';
    if (data.faction === 'Anarch' || data.sect === 'Anarch') return 'border-orange-500/60 shadow-[0_0_10px_rgba(255,100,0,0.3)]';
    return 'border-border/70';
  };

  const defaultAvatar = data.type === 'touchstone' 
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop';

  return (
    <div className={`relative flex flex-col items-center group transition-transform hover:-translate-y-1 ${isDead ? 'opacity-60' : ''}`}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div className={`w-20 h-20 bg-card rounded-md border-2 ${getBorderColor()} overflow-hidden relative`}>
        <img 
          src={data.image || data.portrait || defaultAvatar} 
          alt={data.label}
          className={`w-full h-full object-cover transition-all ${
            isDead ? 'grayscale contrast-150 brightness-50' : data.type === 'npc' || data.type === 'touchstone' ? 'grayscale contrast-125 hover:grayscale-0' : ''
          }`}
        />
        {data.type === 'touchstone' && (
          <div className="absolute top-1 right-1 bg-blue-950/80 border border-blue-400/60 p-0.5 rounded shadow">
            <UserCheck className="w-3 h-3 text-blue-400" />
          </div>
        )}
      </div>
      
      <span className={`mt-2 px-2 py-1 bg-background/90 font-serif text-[10px] tracking-widest uppercase border border-border/50 rounded shadow whitespace-nowrap flex items-center gap-1
        ${data.type === 'coterie' ? 'text-primary font-bold' : isDead ? 'text-rose-400 line-through' : 'text-foreground/90'}`}>
        {data.label}
      </span>

      {data.role && (
        <span className="text-[9px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded mt-0.5 max-w-[110px] truncate text-center">
          {data.role}
        </span>
      )}

      {isDead && (
        <span className="text-[8px] uppercase text-rose-400 font-bold tracking-tight bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.5 rounded absolute -bottom-5 flex items-center gap-0.5">
          <Skull className="w-2.5 h-2.5" /> Morte Final
        </span>
      )}
      {isDamaged && !isDead && (
        <span className="text-[8px] uppercase text-amber-400 font-bold tracking-tight bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded absolute -bottom-5">
          Ferido (+1 Mancha)
        </span>
      )}

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="opacity-0" />
      <Handle type="target" position={Position.Left} id="targetLeft" className="opacity-0" />
      <Handle type="target" position={Position.Right} id="targetRight" className="opacity-0" />
    </div>
  );
}
