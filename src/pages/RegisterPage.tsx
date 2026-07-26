import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, UserPlus, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const { user, loading, signUpWithEmail, loginAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          Crie sua conta para construir seu Domínio.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!email || !password || !confirmPassword) {
              toast.error("Preencha todos os campos.");
              return;
            }
            if (password !== confirmPassword) {
              toast.error("As senhas não coincidem.");
              return;
            }
            setIsSubmitting(true);

            const { error } = await signUpWithEmail(email, password);
            if (error) {
              const msg = error.message || "";
              if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("exceeded")) {
                toast.error("Limite de e-mails do Supabase atingido. Entrando no modo Convidado!");
                loginAsGuest();
              } else {
                toast.error(msg || "Erro ao registrar");
              }
            } else {
              toast.success("Registro realizado com sucesso!");
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

          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isSubmitting ? "Conectando..." : <><UserPlus className="w-4 h-4 mr-2" /> Registrar-se</>}
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
              to="/login"
              className="text-xs text-muted-foreground hover:text-white transition-colors uppercase tracking-wider block mt-2"
            >
              Já tem conta? Entre agora
            </Link>
          </div>
        </form>

        <p className="mt-6 text-[9px] uppercase tracking-[0.3em] text-muted-foreground/40 font-mono">
          By COVIL LABS © 2026
        </p>
      </div>
    </div>
  );
}
