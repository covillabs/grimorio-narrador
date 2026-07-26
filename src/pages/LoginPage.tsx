import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithEmail, loginAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse drop-shadow-[0_0_20px_rgba(220,20,60,0.8)]">
          <img src="/image/icon_2.png" alt="Carregando..." className="w-16 h-16 opacity-80" />
        </div>
      </div>
    );
  }

  // Se já estiver logado, envia pro painel
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden font-serif">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-background to-background"></div>
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/black-scales.png')] opacity-10"></div>
      </div>

      {/* Middle Particle Layer */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://transparenttextures.com/patterns/stardust.png')]"></div>

      <div className="group z-10 bg-zinc-950/60 p-8 md:p-14 border border-blood/20 hover:border-blood/40 rounded-2xl shadow-[0_0_80px_rgba(139,0,0,0.15)] hover:shadow-[0_0_100px_rgba(220,20,60,0.2)] backdrop-blur-md max-w-md w-full mx-4 flex flex-col items-center text-center relative transition-all duration-700 ease-out hover:-translate-y-2">
        {/* Hover reacting Icon */}
        <div className="mb-8 relative cursor-default">
          <div className="absolute inset-0 bg-blood/20 rounded-full blur-2xl group-hover:bg-blood/50 transition-all duration-700 animate-blood-pulse"></div>
          <img
            src="/image/icon_2.png"
            alt="Grimório Icon"
            className="w-28 h-28 object-contain relative z-10 filter drop-shadow-[0_0_15px_rgba(220,20,60,0.6)] group-hover:drop-shadow-[0_0_35px_rgba(220,20,60,1)] group-hover:scale-110 group-hover:-translate-y-3 transition-all duration-700 ease-out"
          />
        </div>

        <h1 className="font-serif text-3xl md:text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-3 drop-shadow-sm uppercase">
          Grimório Narrador
        </h1>
        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-blood to-transparent mb-6"></div>

        <p className="text-muted-foreground/80 text-sm leading-relaxed mb-6 tracking-wide">
          Acesso restrito para Narradores.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email || !password) {
              toast.error("Preencha e-mail e senha.");
              return;
            }
            setIsSubmitting(true);

            const { error } = await signInWithEmail(email, password);
            if (error) {
              const msg = error.message || "";
              if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("exceeded")) {
                toast.error("Limite de requisições atingido. Entrando como Narrador Convidado!");
                loginAsGuest();
              } else {
                toast.error(msg || "Credenciais inválidas");
              }
            } else {
              toast.success("Despertar bem sucedido.");
            }

            setIsSubmitting(false);
          }}
          className="w-full mb-4 space-y-4 text-left"
        >
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-black/40 border-blood/20 focus-visible:ring-blood/50 placeholder:text-muted-foreground/30 h-12"
                placeholder="email@google.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 bg-black/40 border-blood/20 focus-visible:ring-blood/50 placeholder:text-muted-foreground/30 h-12"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-sm font-bold tracking-[0.1em] uppercase bg-blood hover:bg-blood/80 text-white transition-all duration-300"
          >
            {isSubmitting ? "Conectando..." : <><LogIn className="w-4 h-4 mr-2" /> Entrar</>}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={loginAsGuest}
            className="w-full h-10 text-xs font-semibold uppercase tracking-wider border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30 gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Entrar como Narrador Convidado
          </Button>

          <div className="text-center">
            <Link
              to="/register"
              className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-wider block mt-2"
            >
              Não tem a marca? Crie uma conta
            </Link>
          </div>
        </form>

        <div className="w-full flex items-center gap-4 mb-4">
          <div className="h-px bg-border/50 flex-1"></div>
          <span className="text-[10px] uppercase text-muted-foreground tracking-widest">Ou</span>
          <div className="h-px bg-border/50 flex-1"></div>
        </div>

        <Button
          onClick={signInWithGoogle}
          className="w-full h-12 text-sm font-bold tracking-[0.1em] uppercase bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-4 relative overflow-hidden group rounded-lg shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 relative z-10">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="relative z-10">Entrar com o Google</span>
        </Button>

        <p className="mt-6 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/40 font-mono">
          Guiado pelas Sombras • Nunca perdido
        </p>
      </div>
    </div>
  );
}
