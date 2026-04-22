import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCloudStorage } from "@/hooks/useCloudStorage";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, EyeOff, RadioTower } from "lucide-react";
import { BeastWidget } from "@/components/BeastWidget";
import { DiceRollerWidget } from "@/components/DiceRollerWidget";

export function Layout() {
  const { user, loading, signOut } = useAuth();
  const [masqueradeLevel, setMasqueradeLevel] = useCloudStorage<number>("v5_masquerade_level", 0);

  const handleSetLevel = (level: number) => {
    setMasqueradeLevel(level);
  };

  const threatConfig = [
    { level: 0, title: "Seguro", color: "text-zinc-500", bg: "bg-zinc-500" },
    { level: 1, title: "Suspeita", color: "text-blue-500", bg: "bg-blue-500" },
    { level: 2, title: "Investigação Ativa", color: "text-yellow-500", bg: "bg-yellow-500" },
    { level: 3, title: "Caçada Local", color: "text-orange-500", bg: "bg-orange-500" },
    { level: 4, title: "Cerco da Inquisição", color: "text-red-500", bg: "bg-red-500", glitch: true },
    { level: 5, title: "PURGA TOTAL", color: "text-blood-glow", bg: "bg-blood", glitch: true, intense: true },
  ];

  const currentThreat = threatConfig[masqueradeLevel];

  // Regra de Ouro: Só mestre autenticado pisa aqui.
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Prevenir flash da tela durante validação local do hook
  if (loading) {
     return <div className="min-h-screen bg-[#0a0a0a]"></div>;
  }

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full transition-all duration-1000 ${currentThreat.intense ? "bg-red-950/20" : ""}`}>
        
        {/* Camada de Efeito Global de Glitch quando Nível Alto */}
        {currentThreat.glitch && (
          <div className="fixed inset-0 pointer-events-none z-[100] animate-pulse opacity-10">
            <div className="absolute inset-0 bg-red-900 border-[10px] border-red-600 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
          </div>
        )}

        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          
          <header className={`h-14 flex items-center justify-between border-b px-4 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-500 ${currentThreat.glitch ? "border-red-900 bg-red-950/40" : "border-border bg-background/80"}`}>
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              {/* Alerta de Perigo Alto */}
              {currentThreat.glitch && (
                 <div className="flex items-center gap-2 text-red-500 animate-pulse">
                    <RadioTower className="w-5 h-5" />
                    <span className="font-mono text-xs uppercase font-bold tracking-widest hidden md:inline">Interceptação de Sinal Detectada</span>
                 </div>
              )}
            </div>

            {/* Termômetro da Máscara (World State) */}
            <div className="flex flex-col items-end mr-4">
              <div className="flex items-center gap-2 mb-1">
                <button 
                  onClick={signOut} 
                  className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white mr-4 transition-colors"
                  title="Abandonar Sessão"
                >
                   {user?.email?.split('@')[0]} (Sair)
                </button>

                <span className={`text-[10px] uppercase tracking-widest font-bold ${currentThreat.color}`}>
                  Máscara: {currentThreat.title}
                </span>
                {masqueradeLevel >= 4 ? <AlertTriangle className={`w-3 h-3 ${currentThreat.color} animate-bounce`} /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
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

          <main className={`flex-1 p-6 overflow-auto transition-all duration-700 ${currentThreat.glitch ? "filter contrast-125" : ""}`}>
            <Outlet />
          </main>
        
        </div>
        <BeastWidget />
        <DiceRollerWidget />
      </div>
    </SidebarProvider>
  );
}
