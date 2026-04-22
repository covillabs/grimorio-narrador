import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const isInitialMount = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Efeito 1: Sincronização inicial da Nuvem para o Local no Momento do Login
  useEffect(() => {
    if (!user) return;

    const fetchCloudData = async () => {
      try {
        const { data, error } = await supabase
          .from("narrator_data")
          .select("data_value")
          .eq("data_key", key)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data_value) {
          // Cloud TEM o dado. Sobrescrevemos o local.
          setStoredValue(data.data_value as unknown as T);
          window.localStorage.setItem(key, JSON.stringify(data.data_value));
        } else {
          // Cloud NÃO TEM o dado. Mas se tivermos algo no local persistido ANTES do login (ex: migração),
          // precisamos subir pra nuvem agora.
          const localItem = window.localStorage.getItem(key);
          if (localItem) {
            await supabase.from("narrator_data").upsert({
              user_id: user.id,
              data_key: key,
              data_value: JSON.parse(localItem),
            });
            toast.success(`Dados locais de "${key}" sincronizados para a nuvem.`);
          }
        }
      } catch (error) {
        console.error(`Falha ao buscar [${key}] da nuvem:`, error);
      }
    };

    fetchCloudData();
  }, [user, key]);

  // Efeito 2: Qualquer mundança no state atualiza local e debouce pra Nuvem
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salva no state
      setStoredValue(valueToStore);
      
      // Salva offline instantâneo
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Se logado, debounce de 1 segundo para salvar na nuvem
      if (user) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        syncTimeoutRef.current = setTimeout(async () => {
          const { error } = await supabase.from("narrator_data").upsert({
            user_id: user.id,
            data_key: key,
            data_value: valueToStore as any,
          });
          
          if (error) {
             console.error(`Erro ao sincronizar [${key}] para a nuvem:`, error);
          }
        }, 1000); // 1s Debounce
      }
    } catch (error) {
      console.warn(`Error setting key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
