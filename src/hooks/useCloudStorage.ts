import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getPrefixedKey } from "@/components/ChronicleSwitcher";

export function useCloudStorage<T>(baseKey: string, initialValue: T): [T, (value: T | ((val: T) => T), immediate?: boolean) => void] {
  const { user } = useAuth();
  
  const key = getPrefixedKey(baseKey);

  // Initialize from local storage as quick fallback
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const hasFetchedCloud = useRef(false);
  const userHasInteracted = useRef(false);

  // Efeito: Sincronização inicial da Nuvem (UMA VEZ após login)
  // Não sobrescreve se o usuário já interagiu nesta sessão.
  useEffect(() => {
    if (!user || hasFetchedCloud.current) return;
    hasFetchedCloud.current = true;

    const fetchCloudData = async () => {
      try {
        const localItem = window.localStorage.getItem(key);

        // Estratégia Local-First: Se o navegador já tem dados (você digitou e deu F5), 
        // nós assumimos que ele é a versão mais recente e verdadeira.
        if (localItem) {
          // Apenas garantimos que a nuvem receba essa versão local atualizada
          supabase.from("narrator_data").upsert({
            user_id: user.id,
            data_key: key,
            data_value: JSON.parse(localItem),
          }).then(({ error }) => {
            if (error) console.error(`Erro ao espelhar [${key}] local para nuvem:`, error);
          });
          return; // Para aqui. Não deixa a nuvem sobrescrever o que está no local.
        }

        // Se o local está vazio (primeiro login num PC novo), aí sim puxamos da nuvem
        const { data, error } = await supabase
          .from("narrator_data")
          .select("data_value")
          .eq("data_key", key)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data_value !== undefined && data.data_value !== null) {
          if (!userHasInteracted.current) {
            setStoredValue(data.data_value as unknown as T);
            window.localStorage.setItem(key, JSON.stringify(data.data_value));
          }
        }
      } catch (error) {
        console.error(`Falha ao buscar [${key}] da nuvem:`, error);
      }
    };

    fetchCloudData();
  }, [user, key]);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save: Salva localmente IMEDIATAMENTE e na nuvem com DEBOUNCE (ou imediatamente se forçado)
  const setValue = useCallback((value: T | ((val: T) => T), immediate: boolean = false) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      userHasInteracted.current = true;
      
      // Salva no state
      setStoredValue(valueToStore);
      
      // Salva offline instantâneo
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Se logado, envia pra nuvem
      if (user) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        const saveToCloud = () => {
          supabase.from("narrator_data").upsert({
            user_id: user.id,
            data_key: key,
            data_value: valueToStore as any,
          }).then(({ error }) => {
            if (error) {
              console.error(`Erro ao sincronizar [${key}] para a nuvem:`, error);
            }
          });
        };

        if (immediate) {
          saveToCloud();
        } else {
          syncTimeoutRef.current = setTimeout(saveToCloud, 1500); // 1.5s de debounce
        }
      }
    } catch (error) {
      console.warn(`Error setting key "${key}":`, error);
    }
  }, [storedValue, user, key]);

  return [storedValue, setValue];
}
