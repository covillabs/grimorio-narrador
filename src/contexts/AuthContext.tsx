import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      
      if (error && error.code !== 'PGRST116') throw error; // Ignorar erro de 'não encontrado' temporariamente
      setProfile(data || null);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        
        const currentUser = session?.user ?? null;
        
        if (mounted) setUser(currentUser);
        
        if (currentUser && mounted) {
          await fetchProfile(currentUser.id);
        }
      } catch (error) {
        console.error("Erro ao inicializar sessão:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;

      const currentUser = session?.user ?? null;
      if (mounted) setUser(currentUser);

      if (currentUser && mounted) {
        // Não vamos travar o loading principal por causa de uma mudança de auth
        // apenas buscamos o perfil em background
        fetchProfile(currentUser.id);
      } else {
        if (mounted) setProfile(null);
      }
      
      if (mounted && loading) {
         setLoading(false);
      }
    });

    // Timeout de segurança: Se o Supabase travar por rede, liberamos a tela após 3 segundos
    const fallbackTimer = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Erro ao conectar com Google");
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Desconectado com sucesso.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
