import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { RELATION_STYLE_MAP, type RelationType } from '@/types/intrigas';

/**
 * Custom Edge para a Teia de Intrigas.
 * Renderiza linhas com cores, estilos e labels visuais diferentes
 * conforme o tipo de relação V5 (Laço de Sangue, Rivalidade, Boon, etc.).
 */
export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  style,
  selected,
}: EdgeProps) {
  const relationType = (data?.relationType as RelationType) || 'Custom';
  const config = RELATION_STYLE_MAP[relationType] || RELATION_STYLE_MAP.Custom;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const displayLabel = (label as string) || config.label;

  // Glow filter para arestas especiais
  const hasGlow = !!config.glowColor && (relationType === 'BloodBond' || selected);

  return (
    <>
      {/* Glow layer (renderizado antes da aresta principal) */}
      {hasGlow && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: config.stroke,
            strokeWidth: (config.strokeWidth || 2) + 4,
            strokeOpacity: 0.25,
            filter: `blur(4px)`,
            strokeDasharray: config.strokeDasharray,
          }}
        />
      )}

      {/* Aresta principal */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: config.stroke,
          strokeWidth: config.strokeWidth || 2,
          strokeDasharray: config.strokeDasharray,
          ...style,
          transition: 'stroke-width 0.2s ease, stroke-opacity 0.3s ease',
        }}
      />

      {/* Label como badge flutuante */}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <div
            className={`
              flex items-center gap-1 px-2 py-0.5 rounded-md
              border shadow-lg backdrop-blur-md cursor-pointer
              transition-all duration-200 hover:scale-110
              ${selected
                ? 'border-primary/60 bg-primary/20 shadow-primary/20'
                : 'border-border/40 bg-background/85 hover:bg-background/95'
              }
            `}
            style={{
              borderColor: selected ? undefined : `${config.stroke}40`,
            }}
          >
            <span className="text-[8px]">{config.icon}</span>
            <span
              className="text-[9px] font-serif font-semibold uppercase tracking-wider max-w-[100px] truncate"
              style={{ color: config.stroke }}
            >
              {displayLabel}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
