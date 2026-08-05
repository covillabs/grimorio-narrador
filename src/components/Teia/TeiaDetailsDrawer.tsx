import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Network, Pencil, Trash2, X, Link2, Crown, Users, Ghost, UserCheck,
  Droplets, Swords, HandHeart, ScrollText, Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { RELATION_STYLE_MAP, type RelationType, type TeiaNodeData, type TeiaEdgeData } from "@/types/intrigas";
import type { Node, Edge } from "@xyflow/react";

// ═══════════════════════════════════════════════════════════
// DRAWER DE DETALHES — Abre ao clicar em nó ou aresta
// ═══════════════════════════════════════════════════════════

interface TeiaDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  // Nó selecionado
  selectedNode: Node | null;
  // Aresta selecionada
  selectedEdge: Edge | null;
  // Todas as arestas (para listar conexões do nó)
  allEdges: Edge[];
  // Todos os nós (para resolver nomes)
  allNodes: Node[];
  // Callbacks
  onDeleteEdge: (edgeId: string) => void;
  onUpdateEdge: (edgeId: string, updates: { label?: string; description?: string }) => void;
  onEditNode: (nodeId: string) => void;
}

/** Resolve o nome de um nó pelo ID */
function getNodeName(nodes: Node[], nodeId: string): string {
  const node = nodes.find((n) => n.id === nodeId);
  return (node?.data?.label as string) || nodeId;
}

/** Ícone do tipo de relação */
function RelationIcon({ type }: { type: string }) {
  switch (type) {
    case "BloodBond": return <Droplets className="w-3.5 h-3.5 text-red-400" />;
    case "Enemy": return <Swords className="w-3.5 h-3.5 text-rose-400" />;
    case "Boon": return <ScrollText className="w-3.5 h-3.5 text-amber-400" />;
    case "Sire": return <Crown className="w-3.5 h-3.5 text-purple-400" />;
    case "Touchstone": return <HandHeart className="w-3.5 h-3.5 text-blue-400" />;
    case "Coterie": return <Users className="w-3.5 h-3.5 text-red-400" />;
    case "Alliance": return <Shield className="w-3.5 h-3.5 text-green-400" />;
    default: return <Link2 className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

/** Ícone do tipo de nó */
function NodeTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "vampire": return <Crown className="w-4 h-4 text-red-400" />;
    case "touchstone": return <UserCheck className="w-4 h-4 text-blue-400" />;
    case "coterie": return <Users className="w-4 h-4 text-red-500" />;
    default: return <Ghost className="w-4 h-4 text-muted-foreground" />;
  }
}

// ── PAINEL DE DETALHES DE NÓ ──
function NodeDetails({
  node, edges, allNodes, onEditNode, onClose,
}: {
  node: Node;
  edges: Edge[];
  allNodes: Node[];
  onEditNode: (id: string) => void;
  onClose: () => void;
}) {
  const data = node.data as TeiaNodeData;
  const connections = edges.filter((e) => e.source === node.id || e.target === node.id);

  return (
    <div className="flex flex-col h-full">
      {/* Avatar + Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-lg border-2 border-border/60 overflow-hidden bg-card shrink-0">
          {data.image ? (
            <img src={data.image} alt={data.label} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <NodeTypeIcon type={data.type} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-bold text-foreground truncate">{data.label}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {data.clan && (
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-red-500/40 text-red-300">
                {data.clan}
              </Badge>
            )}
            {data.faction && (
              <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-border/60 text-muted-foreground">
                {data.faction}
              </Badge>
            )}
          </div>
          {data.role && (
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{data.role}</p>
          )}
        </div>
      </div>

      {/* Humanidade (vampiros) */}
      {data.humanity !== undefined && (
        <div className="mb-4">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-1.5">Humanidade</span>
          <div className="flex gap-[3px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-[8px] h-[8px] rounded-full border ${
                  i < (data.humanity ?? 7) ? "bg-red-500 border-red-600" : "bg-zinc-800 border-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <Separator className="mb-3" />

      {/* Lista de Conexões */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
          <Network className="w-3 h-3" /> Vínculos ({connections.length})
        </span>
      </div>

      <ScrollArea className="flex-1 -mx-1">
        <div className="space-y-1.5 px-1">
          {connections.length === 0 && (
            <p className="text-xs text-muted-foreground/60 italic text-center py-4">Nenhum vínculo registrado</p>
          )}
          {connections.map((edge) => {
            const relType = (edge.data?.relationType as RelationType) || "Custom";
            const config = RELATION_STYLE_MAP[relType] || RELATION_STYLE_MAP.Custom;
            const otherNodeId = edge.source === node.id ? edge.target : edge.source;
            const otherName = getNodeName(allNodes, otherNodeId);
            const direction = edge.source === node.id ? "→" : "←";

            return (
              <div
                key={edge.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-card/40 border border-border/30 hover:bg-card/70 transition-colors"
              >
                <RelationIcon type={relType} />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-foreground block truncate">
                    {direction} {otherName}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: config.stroke }}>
                    {(edge.label as string) || config.label}
                  </span>
                </div>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: config.stroke }}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Separator className="my-3" />

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs"
          onClick={() => { onEditNode(node.id); onClose(); }}
        >
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Button>
      </div>
    </div>
  );
}

// ── PAINEL DE DETALHES DE ARESTA ──
function EdgeDetails({
  edge, allNodes, onDelete, onUpdate,
}: {
  edge: Edge;
  allNodes: Node[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { label?: string; description?: string }) => void;
}) {
  const relType = (edge.data?.relationType as RelationType) || "Custom";
  const config = RELATION_STYLE_MAP[relType] || RELATION_STYLE_MAP.Custom;
  const sourceName = getNodeName(allNodes, edge.source);
  const targetName = getNodeName(allNodes, edge.target);

  const [editLabel, setEditLabel] = useState((edge.label as string) || "");
  const [editDesc, setEditDesc] = useState((edge.data?.description as string) || "");
  const [isEditing, setIsEditing] = useState(false);

  // Sincroniza quando muda a aresta selecionada
  useEffect(() => {
    setEditLabel((edge.label as string) || "");
    setEditDesc((edge.data?.description as string) || "");
    setIsEditing(false);
  }, [edge.id]);

  const isCoterie = edge.id.startsWith("edge_coterie_");
  const isTouchstone = edge.id.startsWith("edge_ts_");
  const isSystem = isCoterie || isTouchstone;

  const handleSave = () => {
    onUpdate(edge.id, { label: editLabel.trim(), description: editDesc.trim() });
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tipo de relação */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
          style={{ borderColor: `${config.stroke}50`, backgroundColor: `${config.stroke}15` }}
        >
          {config.icon}
        </div>
        <div>
          <h3 className="font-serif text-base font-bold" style={{ color: config.stroke }}>
            {config.label}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Vínculo</p>
        </div>
      </div>

      {/* Participantes */}
      <div className="bg-card/50 border border-border/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <span className="text-xs font-bold text-foreground block truncate">{sourceName}</span>
            <span className="text-[9px] text-muted-foreground uppercase">Origem</span>
          </div>
          <div className="px-3">
            <div className="w-8 h-[2px] rounded" style={{ backgroundColor: config.stroke }} />
            <span className="text-[8px] text-muted-foreground block text-center mt-0.5">→</span>
          </div>
          <div className="text-center flex-1">
            <span className="text-xs font-bold text-foreground block truncate">{targetName}</span>
            <span className="text-[9px] text-muted-foreground uppercase">Destino</span>
          </div>
        </div>
      </div>

      <Separator className="mb-3" />

      {/* Descrição / Label */}
      <div className="space-y-3 flex-1">
        <div>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">Rótulo</span>
          {isEditing ? (
            <Input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="text-sm"
              placeholder="Nome do vínculo..."
            />
          ) : (
            <p className="text-sm text-foreground font-medium">{(edge.label as string) || config.label}</p>
          )}
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">Notas / Descrição</span>
          {isEditing ? (
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="text-sm min-h-[80px]"
              placeholder="Histórico do relacionamento, pactos, segredos..."
            />
          ) : (
            <p className="text-xs text-muted-foreground/80 italic">
              {(edge.data?.description as string) || "Nenhuma nota registrada."}
            </p>
          )}
        </div>
      </div>

      {/* Linha do visual */}
      <div className="mt-3 bg-card/30 border border-border/20 rounded-md p-2 flex items-center gap-2">
        <div
          className="h-[3px] flex-1 rounded"
          style={{
            backgroundColor: config.stroke,
            ...(config.strokeDasharray ? { backgroundImage: 'none' } : {}),
          }}
        />
        <span className="text-[8px] uppercase tracking-widest text-muted-foreground shrink-0">
          {config.animated ? "Animada" : "Estática"} • {config.strokeWidth}px
        </span>
      </div>

      <Separator className="my-3" />

      {/* Ações */}
      <div className="flex gap-2">
        {!isSystem && (
          <>
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button size="sm" className="flex-1 text-xs gap-1" onClick={handleSave}>
                  <Pencil className="w-3 h-3" /> Salvar
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5 text-xs"
                  onClick={() => onDelete(edge.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remover
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar Notas
                </Button>
              </>
            )}
          </>
        )}
        {isSystem && (
          <p className="text-[10px] text-muted-foreground/60 italic text-center w-full py-1">
            Vínculo de sistema — gerado automaticamente
          </p>
        )}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──
export function TeiaDetailsDrawer({
  open,
  onClose,
  selectedNode,
  selectedEdge,
  allEdges,
  allNodes,
  onDeleteEdge,
  onUpdateEdge,
  onEditNode,
}: TeiaDetailsDrawerProps) {
  const hasContent = !!selectedNode || !!selectedEdge;

  return (
    <Sheet open={open && hasContent} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-[340px] sm:w-[380px] bg-background/95 backdrop-blur-xl border-l border-border/50 p-5"
      >
        <SheetHeader className="pb-3 border-b border-border/30 mb-4">
          <SheetTitle className="font-serif text-sm flex items-center gap-2 text-foreground/80">
            {selectedNode && <><NodeTypeIcon type={(selectedNode.data as TeiaNodeData).type} /> Detalhes do Nó</>}
            {selectedEdge && <><Link2 className="w-4 h-4 text-primary" /> Detalhes do Vínculo</>}
          </SheetTitle>
        </SheetHeader>

        {selectedNode && (
          <NodeDetails
            node={selectedNode}
            edges={allEdges}
            allNodes={allNodes}
            onEditNode={onEditNode}
            onClose={onClose}
          />
        )}

        {selectedEdge && !selectedNode && (
          <EdgeDetails
            edge={selectedEdge}
            allNodes={allNodes}
            onDelete={(id) => { onDeleteEdge(id); onClose(); }}
            onUpdate={onUpdateEdge}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
