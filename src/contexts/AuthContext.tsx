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
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// O id DEVE ser "guest" para coincidir com o namespace do ChronicleSwitcher
const GUEST_USER: User = {
  id: "guest",
  app_metadata: { provider: "guest" },
  user_metadata: { username: "Narrador Convidado" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "narrador@grimorio.local",
  phone: "",
  role: "authenticated",
  updated_at: new Date().toISOString(),
} as User;

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  loginAsGuest: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      if (userId === GUEST_USER.id) {
        setProfile({ id: GUEST_USER.id, username: "Narrador Convidado", avatar_url: null });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
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

  const loginAsGuest = () => {
    // Setar o namespace ANTES de qualquer coisa para que o reload já use "guest"
    localStorage.setItem("v5_active_user_id", "guest");
    localStorage.setItem("v5_guest_mode", "true");
    toast.success("Despertar bem sucedido (Modo Convidado).");
    // Hard reload garante re-mount de TODOS os componentes com namespace limpo
    window.location.replace("/");
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const isGuest = localStorage.getItem("v5_guest_mode") === "true";
        if (isGuest) {
          // Garantir que o namespace está setado para "guest"
          localStorage.setItem("v5_active_user_id", "guest");
          if (mounted) {
            setUser(GUEST_USER);
            setProfile({ id: GUEST_USER.id, username: "Narrador Convidado", avatar_url: null });
            setLoading(false);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentUser = session?.user ?? null;
        if (mounted) setUser(currentUser);

        if (currentUser && mounted) {
          // Setar o namespace do userId para isolar dados no localStorage
          localStorage.setItem("v5_active_user_id", currentUser.id);
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
      if (event === "INITIAL_SESSION") return;

      const isGuest = localStorage.getItem("v5_guest_mode") === "true";
      if (isGuest) return;

      const currentUser = session?.user ?? null;
      if (mounted) setUser(currentUser);

      if (currentUser && mounted) {
        // Manter namespace sincronizado ao trocar de sessão
        localStorage.setItem("v5_active_user_id", currentUser.id);
        fetchProfile(currentUser.id);
      } else {
        if (mounted) setProfile(null);
      }

      if (mounted && loading) {
        setLoading(false);
      }
    });

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
      localStorage.removeItem("v5_guest_mode");
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

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      localStorage.removeItem("v5_guest_mode");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;
      // Setar namespace imediatamente após login bem-sucedido
      if (data.user) {
        localStorage.setItem("v5_active_user_id", data.user.id);
      }
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      localStorage.removeItem("v5_guest_mode");
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Limpar flags de sessão
      localStorage.removeItem("v5_guest_mode");
      localStorage.removeItem("v5_active_user_id");
      
      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes("session_not_found")) throw error;
      
      toast.success("Desconectado com sucesso.");
      // Hard redirect para garantir reset completo de toda a árvore React
      window.location.replace("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
      // Mesmo com erro, redirecionar para evitar estado inconsistente
      window.location.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsGuest,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
