import { Handle, Position } from '@xyflow/react';
import { Crown, Users, Skull } from 'lucide-react';

/** Nó Central da Coterie — grande, vermelho, estilo brasão */
export function CoterieNode({ data }: { data: any }) {
  return (
    <div className="relative flex flex-col items-center group">
      <Handle type="source" position={Position.Top} className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="target" position={Position.Top} id="targetTop" className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="target" position={Position.Bottom} id="targetBottom" className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="target" position={Position.Left} id="targetLeft" className="!bg-red-500 !w-2 !h-2 !border-red-800" />
      <Handle type="target" position={Position.Right} id="targetRight" className="!bg-red-500 !w-2 !h-2 !border-red-800" />

      <div className="w-28 h-28 rounded-full border-[3px] border-red-700 bg-gradient-to-b from-red-950/90 to-black/90 shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
        {data.image ? (
          <img src={data.image} alt={data.label} className="w-full h-full object-cover rounded-full" />
        ) : (
          <Crown className="w-10 h-10 text-red-400" />
        )}
      </div>
      <div className="mt-2 px-3 py-1 bg-red-950/90 border border-red-700/80 rounded-md shadow-lg">
        <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-red-300">{data.label}</span>
      </div>
      {data.memberCount !== undefined && (
        <span className="mt-1 text-[9px] text-red-400/70 flex items-center gap-1">
          <Users className="w-3 h-3" /> {data.memberCount} membros
        </span>
      )}
    </div>
  );
}

/** Nó de Vampiro / Jogador — retrato quadrado, borda vermelha, humanidade */
export function VampireNode({ data }: { data: any }) {
  const isDead = data.status === "Morte Final" || data.status === "destroyed";
  const humanity = data.humanity ?? 7;

  const getClanGlow = () => {
    const c = (data.clan || "").toLowerCase();
    if (c.includes("ventrue")) return "shadow-[0_0_12px_rgba(234,179,8,0.4)]";
    if (c.includes("toreador")) return "shadow-[0_0_12px_rgba(244,63,94,0.4)]";
    if (c.includes("brujah")) return "shadow-[0_0_12px_rgba(239,68,68,0.4)]";
    if (c.includes("nosferatu")) return "shadow-[0_0_12px_rgba(34,197,94,0.4)]";
    if (c.includes("malkavian")) return "shadow-[0_0_12px_rgba(168,85,247,0.4)]";
    if (c.includes("tremere")) return "shadow-[0_0_12px_rgba(59,130,246,0.4)]";
    if (c.includes("gangrel")) return "shadow-[0_0_12px_rgba(180,83,9,0.4)]";
    return "shadow-[0_0_12px_rgba(185,28,28,0.35)]";
  };

  const defaultAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop";

  return (
    <div className={`relative flex flex-col items-center group transition-transform hover:-translate-y-1 ${isDead ? "opacity-50" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-red-600 !w-2 !h-2 !border-red-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-red-600 !w-2 !h-2 !border-red-900" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-red-600 !w-2 !h-2 !border-red-900" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-red-600 !w-2 !h-2 !border-red-900" />
      <Handle type="target" position={Position.Left} id="targetLeft" className="!bg-red-600 !w-2 !h-2 !border-red-900" />
      <Handle type="target" position={Position.Right} id="targetRight" className="!bg-red-600 !w-2 !h-2 !border-red-900" />

      <div className={`w-20 h-20 rounded-lg border-2 border-red-700/80 bg-card overflow-hidden ${getClanGlow()}`}>
        <img
          src={data.image || defaultAvatar}
          alt={data.label}
          className={`w-full h-full object-cover ${isDead ? "grayscale brightness-50" : ""}`}
        />
      </div>

      {/* Barra de Humanidade */}
      <div className="flex gap-[2px] mt-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-[5px] h-[5px] rounded-full border ${
              i < humanity ? "bg-red-500 border-red-600" : "bg-zinc-800 border-zinc-700"
            }`}
          />
        ))}
      </div>

      <div className="mt-1 px-2 py-0.5 bg-background/95 border border-border/60 rounded shadow-md">
        <span className={`font-serif text-[10px] font-bold uppercase tracking-widest ${isDead ? "text-rose-400 line-through" : "text-foreground"}`}>
          {data.label}
        </span>
      </div>
      {data.clan && (
        <span className="text-[8px] text-muted-foreground/80 uppercase tracking-widest mt-0.5">{data.clan}</span>
      )}
      {isDead && (
        <span className="absolute -bottom-4 text-[7px] uppercase text-rose-400 font-bold flex items-center gap-0.5 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/30">
          <Skull className="w-2.5 h-2.5" /> Morte Final
        </span>
      )}
    </div>
  );
}

/** Nó de Pilar / Touchstone — retrato redondo, azul, badge de âncora */
export function TouchstoneNode({ data }: { data: any }) {
  const isDead = data.status === "Morte Final" || data.status === "destroyed";
  const isDamaged = data.status === "damaged" || data.status === "Ferido";

  const borderClass = isDead
    ? "border-rose-600/70 shadow-[0_0_10px_rgba(225,29,72,0.5)]"
    : isDamaged
    ? "border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
    : "border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.35)]";

  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop";

  return (
    <div className={`relative flex flex-col items-center group transition-transform hover:-translate-y-1 ${isDead ? "opacity-50" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-1.5 !h-1.5 !border-blue-800" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-1.5 !h-1.5 !border-blue-800" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-blue-500 !w-1.5 !h-1.5 !border-blue-800" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-blue-500 !w-1.5 !h-1.5 !border-blue-800" />
      <Handle type="target" position={Position.Left} id="targetLeft" className="!bg-blue-500 !w-1.5 !h-1.5 !border-blue-800" />
      <Handle type="target" position={Position.Right} id="targetRight" className="!bg-blue-500 !w-1.5 !h-1.5 !border-blue-800" />

      <div className={`w-16 h-16 rounded-full border-2 ${borderClass} overflow-hidden bg-card`}>
        <img
          src={data.image || defaultAvatar}
          alt={data.label}
          className={`w-full h-full object-cover ${isDead ? "grayscale brightness-50" : "grayscale-[60%] hover:grayscale-0 transition-all"}`}
        />
      </div>
      {/* Badge de âncora */}
      <div className="absolute -top-1 -right-1 bg-blue-950/90 border border-blue-500/50 p-0.5 rounded-full shadow">
        <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2a3 3 0 0 0-3 3c0 1.3.84 2.4 2 2.82V11H9l3 9 3-9h-2V7.82A3.01 3.01 0 0 0 12 2z" />
        </svg>
      </div>

      <div className="mt-1.5 px-2 py-0.5 bg-blue-950/80 border border-blue-600/40 rounded shadow">
        <span className={`font-serif text-[9px] font-semibold uppercase tracking-wider ${isDead ? "text-rose-400 line-through" : "text-blue-200"}`}>
          {data.label}
        </span>
      </div>
      {data.role && (
        <span className="text-[8px] text-blue-300/60 mt-0.5 max-w-[100px] truncate text-center">{data.role}</span>
      )}
      {isDamaged && !isDead && (
        <span className="absolute -bottom-3 text-[7px] uppercase text-amber-400 font-bold bg-amber-950/80 px-1 py-0.5 rounded border border-amber-500/30">Ferido</span>
      )}
    </div>
  );
}

/** Nó de NPC genérico — retrato quadrado menor, borda cinza/facção */
export function NpcNode({ data }: { data: any }) {
  const isDead = data.status === "Morte Final" || data.status === "destroyed";

  const getFactionBorder = () => {
    const sect = (data.sect || data.faction || "").toLowerCase();
    if (sect.includes("camarilla")) return "border-amber-500/60 shadow-[0_0_8px_rgba(234,179,8,0.25)]";
    if (sect.includes("anarch")) return "border-orange-500/60 shadow-[0_0_8px_rgba(249,115,22,0.25)]";
    if (sect.includes("sabbat") || sect.includes("sabá")) return "border-purple-600/60 shadow-[0_0_8px_rgba(147,51,234,0.25)]";
    return "border-zinc-600/50 shadow-[0_0_6px_rgba(100,100,100,0.15)]";
  };

  const defaultAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop";

  return (
    <div className={`relative flex flex-col items-center group transition-transform hover:-translate-y-1 ${isDead ? "opacity-40" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !w-1.5 !h-1.5 !border-zinc-700" />
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 !w-1.5 !h-1.5 !border-zinc-700" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-zinc-500 !w-1.5 !h-1.5 !border-zinc-700" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-zinc-500 !w-1.5 !h-1.5 !border-zinc-700" />
      <Handle type="target" position={Position.Left} id="targetLeft" className="!bg-zinc-500 !w-1.5 !h-1.5 !border-zinc-700" />
      <Handle type="target" position={Position.Right} id="targetRight" className="!bg-zinc-500 !w-1.5 !h-1.5 !border-zinc-700" />

      <div className={`w-14 h-14 rounded-md border-2 ${getFactionBorder()} overflow-hidden bg-card`}>
        <img
          src={data.image || defaultAvatar}
          alt={data.label}
          className={`w-full h-full object-cover ${isDead ? "grayscale brightness-30" : "grayscale-[70%] hover:grayscale-0 transition-all"}`}
        />
      </div>

      <div className="mt-1 px-1.5 py-0.5 bg-background/90 border border-border/40 rounded shadow">
        <span className={`font-serif text-[9px] font-semibold uppercase tracking-wider ${isDead ? "text-rose-400 line-through" : "text-foreground/80"}`}>
          {data.label}
        </span>
      </div>
      {data.role && (
        <span className="text-[7px] text-muted-foreground/60 uppercase tracking-wide mt-0.5 max-w-[90px] truncate">{data.role}</span>
      )}
      {isDead && (
        <span className="absolute -bottom-3 text-[6px] uppercase text-rose-400 font-bold flex items-center gap-0.5 bg-rose-950/80 px-1 rounded">
          <Skull className="w-2 h-2" /> Morto
        </span>
      )}
    </div>
  );
}
