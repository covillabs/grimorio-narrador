/**
 * Utilitário de Mecânicas Oficiais de Dados de Vampiro: A Máscara 5ª Edição (V5)
 * Implementa com precisão matemática:
 * - D10 exclusivos
 * - Sucesso em 6+
 * - Críticos em pares de 10 (valem 4 sucessos ao todo)
 * - Dados de Fome (Hunger Dice) substituindo dados da parada (0 a 5)
 * - Crítico Bagunçado (Messy Critical)
 * - Falha Bestial (Bestial Failure) considerando Dificuldade
 * - Checagem de Despertar (Rouse Check)
 * - Re-rolagem de Força de Vontade (Willpower Re-roll de até 3 dados normais)
 */

export interface DieResult {
  id: string;
  value: number;
  isHunger: boolean;
  isSuccess: boolean;
  isTen: boolean;
  isOne: boolean;
  rerolled?: boolean;
}

export type RollOutcome =
  | "critical_success"
  | "messy_critical"
  | "success"
  | "failure"
  | "bestial_failure";

export interface RollOptions {
  pool: number;
  hunger: number;
  difficulty?: number | null;
}

export interface RollResult {
  pool: number;
  hunger: number;
  difficulty: number | null;
  normalDice: DieResult[];
  hungerDice: DieResult[];
  rawSuccesses: number;
  criticalPairs: number;
  totalSuccesses: number;
  normalTens: number;
  hungerTens: number;
  hungerOnes: number;
  margin: number | null;
  outcome: RollOutcome;
  outcomeTitle: string;
  outcomeDescription: string;
  canRerollWithWillpower: boolean;
}

export interface RouseCheckResult {
  die: number;
  success: boolean;
  hungerIncreased: boolean;
  title: string;
  description: string;
}

/**
 * Executa uma rolagem oficial de V5 com base na Parada, Fome e Dificuldade opcional.
 */
export function rollV5Pool(
  options: RollOptions,
  customRng: () => number = Math.random
): RollResult {
  const pool = Math.max(1, Math.floor(options.pool || 1));
  const hunger = Math.max(0, Math.min(5, Math.floor(options.hunger || 0)));
  const difficulty =
    options.difficulty !== undefined && options.difficulty !== null
      ? Math.max(1, Math.floor(options.difficulty))
      : null;

  const hungerDiceCount = Math.min(pool, hunger);
  const normalDiceCount = Math.max(0, pool - hungerDiceCount);

  const normalDice: DieResult[] = [];
  let normalTens = 0;
  let rawSuccesses = 0;

  for (let i = 0; i < normalDiceCount; i++) {
    const val = Math.floor(customRng() * 10) + 1;
    const isSuccess = val >= 6;
    const isTen = val === 10;
    if (isSuccess) rawSuccesses++;
    if (isTen) normalTens++;

    normalDice.push({
      id: `norm_${i}_${Date.now()}_${Math.random()}`,
      value: val,
      isHunger: false,
      isSuccess,
      isTen,
      isOne: val === 1,
    });
  }

  const hungerDice: DieResult[] = [];
  let hungerTens = 0;
  let hungerOnes = 0;

  for (let i = 0; i < hungerDiceCount; i++) {
    const val = Math.floor(customRng() * 10) + 1;
    const isSuccess = val >= 6;
    const isTen = val === 10;
    const isOne = val === 1;
    if (isSuccess) rawSuccesses++;
    if (isTen) hungerTens++;
    if (isOne) hungerOnes++;

    hungerDice.push({
      id: `hung_${i}_${Date.now()}_${Math.random()}`,
      value: val,
      isHunger: true,
      isSuccess,
      isTen,
      isOne,
    });
  }

  // Críticos na V5: cada par de 10s vale 4 sucessos no total.
  // Como cada 10 já foi contado como 1 sucesso em rawSuccesses (2 sucessos o par),
  // adicionamos +2 sucessos de bônus por cada par de 10s.
  const totalTens = normalTens + hungerTens;
  const criticalPairs = Math.floor(totalTens / 2);
  const totalSuccesses = rawSuccesses + criticalPairs * 2;

  // Determinação oficial do resultado
  let outcome: RollOutcome = "failure";
  let outcomeTitle = "Falha";
  let outcomeDescription = "O teste não atingiu a Dificuldade necessária.";
  let margin: number | null = null;

  if (difficulty !== null) {
    margin = totalSuccesses - difficulty;
    const isTestSuccess = totalSuccesses >= difficulty;

    if (isTestSuccess) {
      if (criticalPairs > 0) {
        if (hungerTens > 0) {
          outcome = "messy_critical";
          outcomeTitle = "Crítico Bagunçado!";
          outcomeDescription =
            "Êxito absoluto, porém a Besta tomou o controle. Ocorrem quebras da Máscara, violência desmedida ou ganho de Compulsão de Clã.";
        } else {
          outcome = "critical_success";
          outcomeTitle = "Acerto Crítico!";
          outcomeDescription = `Sucesso espetacular com ${totalSuccesses} sucessos (Margem: +${margin}). Ação realizada com maestria sublime.`;
        }
      } else {
        outcome = "success";
        outcomeTitle = "Êxito Normal";
        outcomeDescription = `Teste bem-sucedido com ${totalSuccesses} sucessos (Margem: +${margin}).`;
      }
    } else {
      // Teste falhou
      if (hungerOnes > 0) {
        outcome = "bestial_failure";
        outcomeTitle = "Falha Bestial!";
        outcomeDescription =
          "A rolagem falhou e um 1 surgiu no Dado de Fome. A Besta se impõe em fúria, fraqueza ou compulsão selvagem.";
      } else {
        outcome = "failure";
        outcomeTitle = "Falha";
        outcomeDescription = `Faltaram ${Math.abs(margin)} sucessos para atingir a Dificuldade ${difficulty}.`;
      }
    }
  } else {
    // Modo sem dificuldade estipulada (Contagem livre de sucessos)
    if (criticalPairs > 0) {
      if (hungerTens > 0) {
        outcome = "messy_critical";
        outcomeTitle = "Crítico Bagunçado!";
        outcomeDescription =
          "Par de 10s envolvendo Dado de Fome. Sucesso monstruoso guiado pelos impulsos da Besta.";
      } else {
        outcome = "critical_success";
        outcomeTitle = "Acerto Crítico!";
        outcomeDescription = `Par de 10s obtido (${totalSuccesses} sucessos totais).`;
      }
    } else if (totalSuccesses > 0) {
      outcome = "success";
      outcomeTitle = "Sucessos Acumulados";
      outcomeDescription = `${totalSuccesses} sucessos obtidos na parada de dados.`;
    } else {
      if (hungerOnes > 0) {
        outcome = "bestial_failure";
        outcomeTitle = "Falha Bestial!";
        outcomeDescription = "Nenhum sucesso obtido e '1' tirado em Dado de Fome.";
      } else {
        outcome = "failure";
        outcomeTitle = "Falha Total";
        outcomeDescription = "Nenhum sucesso obtido na rolagem.";
      }
    }
  }

  // Regra da V5: Força de Vontade permite re-rolar até 3 dados NORMAIS que NÃO sejam 10s.
  // Dados de Fome NUNCA podem ser re-rolados com Força de Vontade.
  const rerollableNormalDice = normalDice.filter((d) => d.value < 10);
  const canRerollWithWillpower = rerollableNormalDice.length > 0;

  return {
    pool,
    hunger,
    difficulty,
    normalDice,
    hungerDice,
    rawSuccesses,
    criticalPairs,
    totalSuccesses,
    normalTens,
    hungerTens,
    hungerOnes,
    margin,
    outcome,
    outcomeTitle,
    outcomeDescription,
    canRerollWithWillpower,
  };
}

/**
 * Re-rola até 3 dados normais selecionados usando Força de Vontade.
 */
export function rerollWithWillpower(
  currentResult: RollResult,
  diceIdsToReroll: string[],
  customRng: () => number = Math.random
): RollResult {
  // Limita a até 3 dados normais
  const selectedIds = new Set(diceIdsToReroll.slice(0, 3));

  const updatedNormalDice = currentResult.normalDice.map((die) => {
    if (selectedIds.has(die.id) && die.value < 10) {
      const newVal = Math.floor(customRng() * 10) + 1;
      return {
        ...die,
        value: newVal,
        isSuccess: newVal >= 6,
        isTen: newVal === 10,
        isOne: newVal === 1,
        rerolled: true,
      };
    }
    return die;
  });

  // Recalcular métricas
  let rawSuccesses = 0;
  let normalTens = 0;

  for (const d of updatedNormalDice) {
    if (d.isSuccess) rawSuccesses++;
    if (d.isTen) normalTens++;
  }

  let hungerTens = 0;
  let hungerOnes = 0;
  for (const d of currentResult.hungerDice) {
    if (d.isSuccess) rawSuccesses++;
    if (d.isTen) hungerTens++;
    if (d.isOne) hungerOnes++;
  }

  const totalTens = normalTens + hungerTens;
  const criticalPairs = Math.floor(totalTens / 2);
  const totalSuccesses = rawSuccesses + criticalPairs * 2;

  let outcome: RollOutcome = "failure";
  let outcomeTitle = "Falha";
  let outcomeDescription = "Após o re-roll de Força de Vontade, o teste não atingiu a Dificuldade.";
  let margin: number | null = null;

  if (currentResult.difficulty !== null) {
    margin = totalSuccesses - currentResult.difficulty;
    const isTestSuccess = totalSuccesses >= currentResult.difficulty;

    if (isTestSuccess) {
      if (criticalPairs > 0) {
        if (hungerTens > 0) {
          outcome = "messy_critical";
          outcomeTitle = "Crítico Bagunçado!";
          outcomeDescription = "A re-rolagem gerou um acerto crítico impulsionado pela Fome!";
        } else {
          outcome = "critical_success";
          outcomeTitle = "Acerto Crítico!";
          outcomeDescription = `A força de vontade salvou a rolagem! ${totalSuccesses} sucessos (Margem: +${margin}).`;
        }
      } else {
        outcome = "success";
        outcomeTitle = "Êxito Normal";
        outcomeDescription = `Sucesso garantido após re-roll com ${totalSuccesses} sucessos (Margem: +${margin}).`;
      }
    } else {
      if (hungerOnes > 0) {
        outcome = "bestial_failure";
        outcomeTitle = "Falha Bestial!";
        outcomeDescription = "Mesmo com Força de Vontade, o teste falhou e o 1 na Fome prevaleceu.";
      } else {
        outcome = "failure";
        outcomeTitle = "Falha Mantida";
        outcomeDescription = `Faltaram ${Math.abs(margin)} sucessos para a Dificuldade ${currentResult.difficulty}.`;
      }
    }
  } else {
    outcome = totalSuccesses > 0 ? "success" : "failure";
    outcomeTitle = totalSuccesses > 0 ? "Sucessos" : "Falha";
    outcomeDescription = `${totalSuccesses} sucessos totais após a re-rolagem.`;
  }

  return {
    ...currentResult,
    normalDice: updatedNormalDice,
    rawSuccesses,
    criticalPairs,
    totalSuccesses,
    normalTens,
    margin,
    outcome,
    outcomeTitle,
    outcomeDescription,
    canRerollWithWillpower: false, // Força de vontade só pode ser gasta uma vez por teste
  };
}

/**
 * Executa uma Checagem de Despertar do Sangue (Rouse Check - 1d10).
 * Na V5: Se o resultado for 6 a 10, o vampiro sacia o uso sem aumentar Fome.
 * Se for 1 a 5, o sangue clama e a Fome aumenta em +1.
 */
export function rollRouseCheck(
  currentHunger: number = 1,
  customRng: () => number = Math.random
): RouseCheckResult {
  const die = Math.floor(customRng() * 10) + 1;
  const success = die >= 6;
  const hungerIncreased = !success;

  if (success) {
    return {
      die,
      success: true,
      hungerIncreased: false,
      title: "✨ Sangue Domado!",
      description: `Tirou ${die} no d10 (6+). O poder foi ativado sem despertar a Besta. A Fome permanece em ${currentHunger}.`,
    };
  } else {
    const nextHunger = Math.min(5, currentHunger + 1);
    const isMaxHunger = nextHunger >= 5;

    return {
      die,
      success: false,
      hungerIncreased: true,
      title: isMaxHunger ? "🩸 FOME MÁXIMA (5)!" : "🩸 O Sangue Clama!",
      description: isMaxHunger
        ? `Tirou ${die} no d10. A Fome atingiu o ápice (5)! O vampiro entra em risco imediato de Frenesi Famélico se não se alimentar.`
        : `Tirou ${die} no d10 (menos de 6). A Besta exigiu seu tributo. Fome aumentada para ${nextHunger}.`,
    };
  }
}
