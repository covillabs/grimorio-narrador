import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, Skull } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-blood">
          <Skull className="w-12 h-12" />
        </div>
      </div>
    );
  }

  // Se já estiver logado, envia pro painel
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
      {/* Background Textures and FX */}
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-background to-background"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/black-scales.png')] opacity-10"></div>
      </div>

      <div className="z-10 bg-zinc-950/80 p-8 md:p-12 border border-blood/20 rounded-xl shadow-[0_0_50px_rgba(139,0,0,0.1)] backdrop-blur-sm max-w-md w-full mx-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-blood/10 rounded-full flex items-center justify-center mb-6 border border-blood/30 shadow-[0_0_15px_rgba(220,20,60,0.2)]">
          <Skull className="w-10 h-10 text-blood-glow" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-widest text-white mb-2">GRIMÓRIO NARRADOR</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Acesso restrito para Arquitetos de Crônicas da 5ª Edição. Seus Segredos, NPCs e Dívidas agora persistem através das noites e dispositivos.
        </p>

        <Button 
          onClick={signInWithGoogle} 
          className="w-full h-12 text-md font-bold tracking-wider bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-3 relative overflow-hidden group"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Despertar com Google
          <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
        </Button>

        <p className="mt-8 text-[10px] uppercase tracking-widest text-muted-foreground/50">
          Você será guiado pelas Sombras, mas nunca perdido nelas.
        </p>
      </div>
    </div>
  );
}
