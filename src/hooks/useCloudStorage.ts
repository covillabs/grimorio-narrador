import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useCloudStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const { user } = useAuth();
  
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
        const { data, error } = await supabase
          .from("narrator_data")
          .select("data_value")
          .eq("data_key", key)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data_value !== undefined && data.data_value !== null) {
          // Cloud TEM o dado e o usuário NÃO interagiu ainda nesta sessão
          if (!userHasInteracted.current) {
            setStoredValue(data.data_value as unknown as T);
            window.localStorage.setItem(key, JSON.stringify(data.data_value));
          }
        } else {
          // Cloud NÃO TEM o dado. Subimos o local para a nuvem.
          const localItem = window.localStorage.getItem(key);
          if (localItem) {
            await supabase.from("narrator_data").upsert({
              user_id: user.id,
              data_key: key,
              data_value: JSON.parse(localItem),
            });
          }
        }
      } catch (error) {
        console.error(`Falha ao buscar [${key}] da nuvem:`, error);
      }
    };

    fetchCloudData();
  }, [user, key]);

  // Save: Salva localmente E na nuvem IMEDIATAMENTE
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      userHasInteracted.current = true;
      
      // Salva no state
      setStoredValue(valueToStore);
      
      // Salva offline instantâneo
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Se logado, salva na nuvem IMEDIATAMENTE (sem debounce)
      if (user) {
        supabase.from("narrator_data").upsert({
          user_id: user.id,
          data_key: key,
          data_value: valueToStore as any,
        }).then(({ error }) => {
          if (error) {
            console.error(`Erro ao sincronizar [${key}] para a nuvem:`, error);
          }
        });
      }
    } catch (error) {
      console.warn(`Error setting key "${key}":`, error);
    }
  }, [storedValue, user, key]);

  return [storedValue, setValue];
}
