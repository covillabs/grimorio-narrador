import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, EyeOff, RadioTower } from "lucide-react";
import { BeastWidget } from "@/components/BeastWidget";
import { DiceRollerWidget } from "@/components/DiceRollerWidget";
import { ProfileSetupModal } from "@/components/ProfileSetupModal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChronicleSwitcher, getPrefixedKey } from "@/components/ChronicleSwitcher";

export function Layout() {
  const { user, profile, loading, signOut } = useAuth();
  const [masqueradeLevel, setMasqueradeLevel] = useState(() => {
    const saved = localStorage.getItem(getPrefixedKey("v5_mascara_local"));
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const handleSetLevel = (level: number) => {
    setMasqueradeLevel(level);
    localStorage.setItem(getPrefixedKey("v5_mascara_local"), level.toString());
  };

  const threatConfig = [
    { level: 0, title: "Seguro", color: "text-zinc-500", bg: "bg-zinc-500" },
    { level: 1, title: "Suspeita", color: "text-blue-500", bg: "bg-blue-500" },
    { level: 2, title: "Investigação Ativa", color: "text-yellow-500", bg: "bg-yellow-500" },
    { level: 3, title: "Caçada Local", color: "text-orange-500", bg: "bg-orange-500" },
    { level: 4, title: "Cerco da Inquisição", color: "text-red-500", bg: "bg-red-500", glitch: true },
    { level: 5, title: "PURGA TOTAL", color: "text-blood-glow", bg: "bg-blood", glitch: true, intense: true },
  ];

  const currentThreat = threatConfig[masqueradeLevel] || threatConfig[0];

  // Exibir indicador gracioso de carregamento com logo
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-3">
        <div className="animate-pulse drop-shadow-[0_0_25px_rgba(220,20,60,0.8)]">
          <img src="/image/icon_2.png" alt="Carregando Domínio..." className="w-16 h-16 opacity-90" />
        </div>
        <span className="font-serif text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          Despertando o Domínio...
        </span>
      </div>
    );
  }

  // Se não estiver logado nem em modo convidado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const needsProfileSetup = user && user.app_metadata?.provider !== "guest" && (!profile || !profile.username);

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full transition-all duration-1000 ${currentThreat.intense ? "bg-red-950/20" : ""}`}>
        {needsProfileSetup && <ProfileSetupModal />}

        {/* Camada de Efeito Global de Glitch quando Nível Alto */}
        {currentThreat.glitch && (
          <div className="fixed inset-0 pointer-events-none z-[100] animate-pulse opacity-10">
            <div className="absolute inset-0 bg-red-900 border-[10px] border-red-600 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
          </div>
        )}

        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className={`h-14 flex items-center justify-between border-b px-4 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-500 ${
              currentThreat.glitch ? "border-red-900 bg-red-950/40" : "border-border bg-background/80"
            }`}
          >
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <ChronicleSwitcher />

              {/* Alerta de Perigo Alto */}
              {currentThreat.glitch && (
                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                  <RadioTower className="w-5 h-5" />
                  <span className="font-mono text-xs uppercase font-bold tracking-widest hidden md:inline">
                    Interceptação de Sinal Detectada
                  </span>
                </div>
              )}
            </div>

            {/* Termômetro da Máscara (World State) */}
            <div className="flex flex-col items-end mr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-2 mr-4 border-r border-border/50 pr-4">
                  {(profile?.username || user?.user_metadata?.username || "Narrador") && (
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/80 hidden sm:inline-block tracking-wider">
                      {profile?.username || user?.user_metadata?.username || "Narrador"}
                    </span>
                  )}
                  <Avatar className="w-6 h-6 border border-border/50">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-zinc-800 text-[10px]">
                      {(profile?.username || user?.email || "N").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={signOut}
                    className="text-[10px] uppercase text-muted-foreground hover:text-red-400 transition-colors ml-2 font-semibold"
                    title="Abandonar Sessão"
                  >
                    (Sair)
                  </button>
                </div>

                <span className={`text-[10px] uppercase tracking-widest font-bold ${currentThreat.color}`}>
                  Máscara: {currentThreat.title}
                </span>
                {masqueradeLevel >= 4 ? (
                  <AlertTriangle className={`w-3 h-3 ${currentThreat.color} animate-bounce`} />
                ) : (
                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleSetLevel(level)}
                    className={`w-4 h-2 rounded-sm transition-all duration-300 hover:scale-125 ${
                      level <= masqueradeLevel ? threatConfig[level].bg : "bg-zinc-800"
                    } ${level === masqueradeLevel && masqueradeLevel > 0 ? "shadow-[0_0_8px_currentColor] scale-110" : ""}`}
                    title={`Nível ${level}: ${threatConfig[level].title}`}
                  />
                ))}
              </div>
            </div>
          </header>

          <main
            className={`flex-1 p-6 overflow-auto transition-all duration-700 ${
              currentThreat.glitch ? "filter contrast-125" : ""
            }`}
          >
            <Outlet />
          </main>
        </div>
        <BeastWidget />
        <DiceRollerWidget />
      </div>
    </SidebarProvider>
  );
}
