import { useMemo } from "react";

export interface ItemModifier {
  id: string;
  target: string;
  value: number;
  isConditional: boolean;
  conditionKey?: string;
}

export interface ItemRule {
  id: string;
  type: string;
  title: string;
  description: string;
  modifiers?: ItemModifier[];
}

export interface ItemWithRules {
  id: string;
  name: string;
  rules_bonus?: ItemRule[] | string;
  [key: string]: any;
}

export interface NpcStats {
  physical_pool?: number;
  social_pool?: number;
  mental_pool?: number;
  health?: number;
  [key: string]: any;
}

export interface DicePoolBreakdown {
  sourceItem: string;
  ruleTitle: string;
  target: string;
  value: number;
  isConditional: boolean;
  conditionKey?: string;
  isActive: boolean;
}

export interface UseDicePoolOptions {
  npc?: NpcStats | null;
  items?: ItemWithRules[];
  poolType: string;
  activeConditions?: Record<string, boolean>;
}

export function useDicePool({
  npc,
  items = [],
  poolType,
  activeConditions = {},
}: UseDicePoolOptions) {
  return useMemo(() => {
    // 1. Determinar Atributo Base do NPC
    let basePool = 0;
    const lowerPool = poolType.toLowerCase();

    if (lowerPool.includes("físic") || lowerPool.includes("fisic")) {
      basePool = npc?.physical_pool || 0;
    } else if (lowerPool.includes("soci")) {
      basePool = npc?.social_pool || 0;
    } else if (lowerPool.includes("ment")) {
      basePool = npc?.mental_pool || 0;
    } else if (lowerPool.includes("comba")) {
      basePool = (npc?.physical_pool || 0);
    } else if (lowerPool.includes("vita") || lowerPool.includes("vida")) {
      basePool = npc?.health || 0;
    } else {
      basePool = npc?.physical_pool || 0;
    }

    // 2. Calcular Modificadores de Itens Equipados
    let itemBonus = 0;
    const breakdown: DicePoolBreakdown[] = [];

    items.forEach((item) => {
      let rulesList: ItemRule[] = [];
      if (Array.isArray(item.rules_bonus)) {
        rulesList = item.rules_bonus;
      } else if (typeof item.rules_bonus === "string" && item.rules_bonus.startsWith("[")) {
        try {
          rulesList = JSON.parse(item.rules_bonus);
        } catch {
          rulesList = [];
        }
      }

      rulesList.forEach((rule) => {
        if (rule.modifiers && Array.isArray(rule.modifiers)) {
          rule.modifiers.forEach((mod) => {
            const modTargetLower = (mod.target || "").toLowerCase();
            const targetMatches =
              modTargetLower === lowerPool ||
              lowerPool.includes(modTargetLower) ||
              modTargetLower.includes(lowerPool) ||
              modTargetLower === "todos" ||
              modTargetLower === "combate";

            if (targetMatches) {
              const conditionName = mod.conditionKey || "condicao_ativa";
              const isConditionMet = !mod.isConditional || !!activeConditions[conditionName];

              breakdown.push({
                sourceItem: item.name || "Item",
                ruleTitle: rule.title || "Modificador",
                target: mod.target,
                value: mod.value || 0,
                isConditional: mod.isConditional,
                conditionKey: mod.conditionKey,
                isActive: isConditionMet,
              });

              if (isConditionMet) {
                itemBonus += mod.value || 0;
              }
            }
          });
        }
      });
    });

    const totalPool = Math.max(0, basePool + itemBonus);

    return {
      basePool,
      itemBonus,
      totalPool,
      breakdown,
    };
  }, [npc, items, poolType, activeConditions]);
}
