import { describe, it, expect } from "vitest";
import { rollV5Pool, rollRouseCheck, rerollWithWillpower } from "../utils/v5Dice";

describe("Mecânicas de Dados V5 (v5Dice.ts)", () => {
  it("deve contar sucessos apenas para dados 6 ou superiores", () => {
    // Sequência controlada: 1, 5, 6, 8, 9
    const rolls = [0.0, 0.4, 0.5, 0.7, 0.8]; // mapeiam para 1, 5, 6, 8, 9
    let callIdx = 0;
    const rng = () => rolls[callIdx++];

    const result = rollV5Pool({ pool: 5, hunger: 0 }, rng);
    expect(result.rawSuccesses).toBe(3); // 6, 8, 9 são sucessos
    expect(result.totalSuccesses).toBe(3);
    expect(result.criticalPairs).toBe(0);
  });

  it("deve transformar pares de 10 em acertos críticos valendo 4 sucessos ao todo", () => {
    // Sequência controlada: dois 10s e um 5 (parada 3, fome 0)
    const rolls = [0.99, 0.99, 0.4]; // 10, 10, 5
    let callIdx = 0;
    const rng = () => rolls[callIdx++];

    const result = rollV5Pool({ pool: 3, hunger: 0, difficulty: 2 }, rng);
    expect(result.rawSuccesses).toBe(2);
    expect(result.criticalPairs).toBe(1);
    expect(result.totalSuccesses).toBe(4); // 2 de base + 2 de bônus do par = 4
    expect(result.outcome).toBe("critical_success");
  });

  it("deve detectar Crítico Bagunçado (Messy Critical) quando um dos 10s vem do Dado de Fome", () => {
    // Parada 4, Fome 2.
    // 2 dados normais: 10, 7. 2 dados de fome: 10, 3.
    const rolls = [0.99, 0.65, 0.99, 0.25]; // 10, 7 (normais) e 10, 3 (fome)
    let callIdx = 0;
    const rng = () => rolls[callIdx++];

    const result = rollV5Pool({ pool: 4, hunger: 2, difficulty: 3 }, rng);
    expect(result.criticalPairs).toBe(1);
    expect(result.hungerTens).toBe(1);
    expect(result.outcome).toBe("messy_critical");
    expect(result.outcomeTitle).toBe("Crítico Bagunçado!");
  });

  it("deve detectar Falha Bestial (Bestial Failure) quando o teste falha contra a Dificuldade e há 1 na Fome", () => {
    // Parada 3, Fome 1, Dificuldade 3.
    // Normais: 6, 7 (2 sucessos). Fome: 1 (falha bestial pois 2 < 3).
    const rolls = [0.55, 0.65, 0.05]; // 6, 7 (normais) e 1 (fome)
    let callIdx = 0;
    const rng = () => rolls[callIdx++];

    const result = rollV5Pool({ pool: 3, hunger: 1, difficulty: 3 }, rng);
    expect(result.totalSuccesses).toBe(2);
    expect(result.hungerOnes).toBe(1);
    expect(result.outcome).toBe("bestial_failure");
    expect(result.outcomeTitle).toBe("Falha Bestial!");
  });

  it("NÃO deve dar Falha Bestial se o teste obtiver sucessos suficientes para a Dificuldade, mesmo com 1 na Fome", () => {
    // Parada 3, Fome 1, Dificuldade 2.
    // Normais: 7, 8 (2 sucessos). Fome: 1. Como 2 >= 2, é sucesso normal!
    const rolls = [0.65, 0.75, 0.05]; // 7, 8 (normais) e 1 (fome)
    let callIdx = 0;
    const rng = () => rolls[callIdx++];

    const result = rollV5Pool({ pool: 3, hunger: 1, difficulty: 2 }, rng);
    expect(result.totalSuccesses).toBe(2);
    expect(result.outcome).toBe("success");
    expect(result.outcomeTitle).toBe("Êxito Normal");
  });

  it("deve executar Checagem de Despertar (Rouse Check) com regras da V5", () => {
    // 6+ = Sucesso (Sangue Domado)
    const successResult = rollRouseCheck(2, () => 0.6); // 7
    expect(successResult.success).toBe(true);
    expect(successResult.hungerIncreased).toBe(false);

    // 1 a 5 = Falha (Fome Aumenta)
    const failureResult = rollRouseCheck(2, () => 0.2); // 3
    expect(failureResult.success).toBe(false);
    expect(failureResult.hungerIncreased).toBe(true);

    // Alerta de Fome 5
    const maxHungerResult = rollRouseCheck(4, () => 0.2); // 3
    expect(maxHungerResult.title).toContain("FOME MÁXIMA (5)");
  });

  it("deve re-rolar até 3 dados normais com Força de Vontade sem tocar nos Dados de Fome", () => {
    // Rolar inicialmente: normal: 2, 3; fome: 4
    const rolls = [0.15, 0.25, 0.35]; // 2, 3 (normais) e 4 (fome)
    let callIdx = 0;
    const rng = () => rolls[callIdx++];

    const initial = rollV5Pool({ pool: 3, hunger: 1, difficulty: 2 }, rng);
    expect(initial.totalSuccesses).toBe(0);

    // Re-rolar os 2 dados normais, tirando 8 e 9
    const rerolls = [0.75, 0.85]; // 8, 9
    let rerollIdx = 0;
    const rerollRng = () => rerolls[rerollIdx++];

    const after = rerollWithWillpower(
      initial,
      [initial.normalDice[0].id, initial.normalDice[1].id],
      rerollRng
    );

    expect(after.totalSuccesses).toBe(2);
    expect(after.outcome).toBe("success");
    expect(after.canRerollWithWillpower).toBe(false); // Só pode uma vez
  });
});
