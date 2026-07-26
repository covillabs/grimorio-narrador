export interface ItemModifier {
  id?: string;
  alvo?: string;
  target?: string;
  valor?: number;
  value?: number;
  isConditional?: boolean;
  condicional?: boolean;
  conditionKey?: string;
  nome_condicao?: string;
}

export interface ItemRule {
  id?: string;
  tipo?: string;
  type?: string;
  nome?: string;
  title?: string;
  descricao?: string;
  description?: string;
  modificadores?: ItemModifier[];
  modifiers?: ItemModifier[];
}

export interface CharacterItem {
  id: string;
  name: string;
  rules_bonus?: ItemRule[] | string;
  regras_bonus?: ItemRule[] | string;
  [key: string]: any;
}

export interface CharacterBase {
  id?: string;
  name?: string;
  character_name?: string;
  physical_pool?: number;
  social_pool?: number;
  mental_pool?: number;
  health?: number;
  health_max?: number;
  willpower_max?: number;
  forca?: number;
  destreza?: number;
  vigor?: number;
  carisma?: number;
  manipulacao?: number;
  compostura?: number;
  inteligencia?: number;
  raciocinio?: number;
  perseveranca?: number;
  [key: string]: any;
}

export interface CalculateStatsOptions {
  activeConditions?: Record<string, boolean>;
}

export interface ModifierApplied {
  sourceItem: string;
  ruleTitle: string;
  target: string;
  value: number;
  isConditional: boolean;
  conditionKey?: string;
  isActive: boolean;
}

/**
 * Função Engine Helper para calcular atributos e paradas de dados finais
 * de um personagem considerando todos os modificadores de seus itens equipados.
 */
export function calculateCharacterStats(
  character: CharacterBase,
  characterItems: CharacterItem[] = [],
  options: CalculateStatsOptions = {}
) {
  const { activeConditions = {} } = options;

  const stats = {
    physical_pool: character.physical_pool ?? 4,
    social_pool: character.social_pool ?? 3,
    mental_pool: character.mental_pool ?? 3,
    combate_pool: (character.physical_pool ?? 4),
    defesa_pool: (character.physical_pool ?? 4),
    health_max: character.health_max ?? character.health ?? 7,
    willpower_max: character.willpower_max ?? 5,
    dano_fisico_bonus: 0,
    dano_agravado_bonus: 0,
    modifiersApplied: [] as ModifierApplied[],
    bonusByTarget: {} as Record<string, number>,
  };

  characterItems.forEach((item) => {
    let rules: ItemRule[] = [];
    const rawRules = item.rules_bonus || item.regras_bonus;
    if (Array.isArray(rawRules)) {
      rules = rawRules;
    } else if (typeof rawRules === "string" && rawRules.startsWith("[")) {
      try {
        rules = JSON.parse(rawRules);
      } catch {
        rules = [];
      }
    }

    rules.forEach((rule) => {
      const mods = rule.modificadores || rule.modifiers || [];
      mods.forEach((mod) => {
        const target = (mod.alvo || mod.target || "combate").toLowerCase();
        const value = Number(mod.valor ?? mod.value ?? 0);
        const isConditional = Boolean(mod.isConditional || mod.condicional);
        const conditionKey = mod.conditionKey || mod.nome_condicao || rule.nome || rule.title;

        const isActive = !isConditional || !!(conditionKey && activeConditions[conditionKey]);

        stats.modifiersApplied.push({
          sourceItem: item.name || "Item",
          ruleTitle: rule.nome || rule.title || "Efeito",
          target,
          value,
          isConditional,
          conditionKey,
          isActive,
        });

        if (isActive) {
          stats.bonusByTarget[target] = (stats.bonusByTarget[target] || 0) + value;

          if (target === "fisico" || target === "físico") {
            stats.physical_pool += value;
            stats.combate_pool += value;
          } else if (target === "social") {
            stats.social_pool += value;
          } else if (target === "mental") {
            stats.mental_pool += value;
          } else if (target === "combate") {
            stats.combate_pool += value;
          } else if (target === "defesa") {
            stats.defesa_pool += value;
          } else if (target === "vitalidade" || target === "saude") {
            stats.health_max += value;
          } else if (target === "vontade") {
            stats.willpower_max += value;
          } else if (target === "dano_fisico") {
            stats.dano_fisico_bonus += value;
          } else if (target === "dano_agravado") {
            stats.dano_agravado_bonus += value;
          } else {
            stats.combate_pool += value;
          }
        }
      });
    });
  });

  return {
    ...stats,
    physical_pool: Math.max(0, stats.physical_pool),
    social_pool: Math.max(0, stats.social_pool),
    mental_pool: Math.max(0, stats.mental_pool),
    combate_pool: Math.max(0, stats.combate_pool),
    defesa_pool: Math.max(0, stats.defesa_pool),
    health_max: Math.max(1, stats.health_max),
    willpower_max: Math.max(1, stats.willpower_max),
  };
}
