import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role?: "narrator" | "player";
}

export interface UserChronicle {
  chronicle_id: string;
  role: "narrator" | "player";
  name: string;
  description?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  activeChronicleId: string | null;
  activeChronicle: UserChronicle | null;
  chronicles: UserChronicle[];
  hasChronicle: boolean;
  isNarrator: boolean;
  isPlayer: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshChronicles: () => Promise<void>;
  setActiveChronicleId: (id: string | null) => void;
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

const GUEST_CHRONICLE: UserChronicle = {
  chronicle_id: "default",
  role: "narrator",
  name: "Crônica do Convidado",
  description: "Ambiente local isolado do Narrador",
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  activeChronicleId: null,
  activeChronicle: null,
  chronicles: [],
  hasChronicle: false,
  isNarrator: false,
  isPlayer: false,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  loginAsGuest: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshChronicles: async () => {},
  setActiveChronicleId: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chronicles, setChronicles] = useState<UserChronicle[]>([]);
  const [activeChronicleId, setActiveChronicleIdState] = useState<string | null>(() => {
    return localStorage.getItem("v5_active_chronicle_id");
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      if (userId === GUEST_USER.id) {
        setProfile({ id: GUEST_USER.id, username: "Narrador Convidado", avatar_url: null, role: "narrator" });
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

  const fetchChronicles = async (userId: string) => {
    try {
      if (userId === GUEST_USER.id) {
        setChronicles([GUEST_CHRONICLE]);
        setActiveChronicleIdState("default");
        return;
      }

      const { data, error } = await supabase
        .from("chronicle_members")
        .select("chronicle_id, role, chronicles(id, name, description)")
        .eq("user_id", userId);

      if (error) throw error;

      const list: UserChronicle[] = (data || []).map((item: any) => ({
        chronicle_id: item.chronicle_id,
        role: item.role as "narrator" | "player",
        name: item.chronicles?.name || "Crônica sem título",
        description: item.chronicles?.description,
      }));

      setChronicles(list);

      // Sincroniza crônica ativa
      const savedId = localStorage.getItem("v5_active_chronicle_id");
      const found = list.find((c) => c.chronicle_id === savedId);
      if (found) {
        setActiveChronicleIdState(found.chronicle_id);
      } else if (list.length > 0) {
        setActiveChronicleIdState(list[0].chronicle_id);
        localStorage.setItem("v5_active_chronicle_id", list[0].chronicle_id);
      } else {
        setActiveChronicleIdState(null);
        localStorage.removeItem("v5_active_chronicle_id");
      }
    } catch (err) {
      console.error("Erro ao carregar crônicas:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshChronicles = async () => {
    if (user) await fetchChronicles(user.id);
  };

  const setActiveChronicleId = (id: string | null) => {
    if (id) {
      localStorage.setItem("v5_active_chronicle_id", id);
    } else {
      localStorage.removeItem("v5_active_chronicle_id");
    }
    setActiveChronicleIdState(id);
  };

  const activeChronicle = chronicles.find((c) => c.chronicle_id === activeChronicleId) || null;
  const hasChronicle = activeChronicle !== null;

  const isNarrator = user?.id === GUEST_USER.id
    ? true
    : activeChronicle?.role === "narrator" || (chronicles.length === 0 && profile?.role === "narrator");

  const isPlayer = user?.id === GUEST_USER.id
    ? false
    : activeChronicle?.role === "player" || (chronicles.length === 0 && profile?.role === "player");

  const loginAsGuest = () => {
    localStorage.setItem("v5_active_user_id", "guest");
    localStorage.setItem("v5_guest_mode", "true");
    localStorage.setItem("v5_active_chronicle_id", "default");
    toast.success("Despertar bem sucedido (Modo Convidado).");
    window.location.replace("/");
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // CORREÇÃO DO BUG: Se a URL contiver parâmetros de confirmação/auth, limpa guest mode
        const hasAuthParams =
          window.location.hash.includes("access_token") ||
          window.location.search.includes("code=") ||
          window.location.search.includes("token_hash=");

        if (hasAuthParams) {
          localStorage.removeItem("v5_guest_mode");
        }

        // Verifica primeiro se há sessão real no Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentUser = session?.user ?? null;

        if (currentUser) {
          localStorage.removeItem("v5_guest_mode");
          if (mounted) {
            setUser(currentUser);
            localStorage.setItem("v5_active_user_id", currentUser.id);
            await Promise.all([
              fetchProfile(currentUser.id),
              fetchChronicles(currentUser.id),
            ]);
          }
          return;
        }

        // Se não tem usuário real, verifica modo convidado
        const isGuest = localStorage.getItem("v5_guest_mode") === "true";
        if (isGuest && mounted) {
          localStorage.setItem("v5_active_user_id", "guest");
          setUser(GUEST_USER);
          setProfile({ id: GUEST_USER.id, username: "Narrador Convidado", avatar_url: null, role: "narrator" });
          setChronicles([GUEST_CHRONICLE]);
          setActiveChronicleIdState("default");
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
        localStorage.setItem("v5_active_user_id", currentUser.id);
        await Promise.all([
          fetchProfile(currentUser.id),
          fetchChronicles(currentUser.id),
        ]);
      } else {
        if (mounted) {
          setProfile(null);
          setChronicles([]);
          setActiveChronicleIdState(null);
        }
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
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("v5_guest_mode");
      localStorage.removeItem("v5_active_user_id");
      localStorage.removeItem("v5_active_chronicle_id");

      const { error } = await supabase.auth.signOut();
      if (error && !error.message?.includes("session_not_found")) throw error;

      toast.success("Desconectado com sucesso.");
      window.location.replace("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao desconectar");
      window.location.replace("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeChronicleId,
        activeChronicle,
        chronicles,
        hasChronicle,
        isNarrator,
        isPlayer,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsGuest,
        signOut,
        refreshProfile,
        refreshChronicles,
        setActiveChronicleId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
