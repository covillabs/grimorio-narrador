/**
 * Helper resiliente para geração de UUIDs RFC4122 v4.
 * Funciona em qualquer ambiente (HTTPS, HTTP, LAN, Mobile, WebViews).
 * Polyfilla window.crypto.randomUUID se não existir.
 */

export function generateUUID(): string {
  // 1. Tenta usar o crypto.randomUUID nativo caso disponível (Secure Context)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Ignora e cai no fallback caso lance erro
    }
  }

  // 2. Fallback usando crypto.getRandomValues (RFC4122 v4)
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Versão 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variante RFC4122
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    } catch {
      // Ignora e cai no fallback Math.random
    }
  }

  // 3. Fallback universal usando Math.random
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Polyfill global automático para garantir que chamadas legadas a crypto.randomUUID() nunca quebrem
if (typeof window !== "undefined") {
  if (!window.crypto) {
    // @ts-ignore
    window.crypto = {};
  }
  if (typeof window.crypto.randomUUID !== "function") {
    try {
      Object.defineProperty(window.crypto, "randomUUID", {
        value: generateUUID,
        configurable: true,
        writable: true,
      });
    } catch {
      // @ts-ignore
      window.crypto.randomUUID = generateUUID;
    }
  }
}
