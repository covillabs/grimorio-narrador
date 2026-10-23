import { Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import { DiceRollerWidget } from "@/components/DiceRollerWidget";
import { BeastWidget } from "@/components/BeastWidget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChronicleSwitcher } from "@/components/ChronicleSwitcher";
import { Shield, Users, BookOpen, Scale, Sparkles, LogOut } from "lucide-react";

const playerNavigation = [
  { title: "Ficha do Personagem", url: "/player", icon: Shield, end: true },
  { title: "A Coterie", url: "/player/coterie", icon: Users },
  { title: "Códice Público", url: "/player/codex", icon: BookOpen },
  { title: "Livro de Dívidas", url: "/player/boons", icon: Scale },
];

export function PlayerLayout() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#070708] text-foreground flex flex-col w-full selection:bg-red-950 selection:text-red-200">
      {/* Header Gótico do Jogador */}
      <header className="h-16 border-b border-border/40 bg-[#0a0a0c]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-red-950 via-red-900/60 to-black border border-red-800/40 flex items-center justify-center shadow-[0_0_12px_rgba(185,28,28,0.25)]">
              <Sparkles className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h1 className="font-serif text-sm sm:text-base font-bold tracking-wider text-zinc-100 flex items-center gap-2">
                Grimório <span className="text-[10px] uppercase font-mono font-normal tracking-widest text-red-500/80 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/30">Coterie</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">Visão do Neófito • Névoa Ativa</p>
            </div>
          </div>
          <div className="hidden md:block pl-2 border-l border-border/30">
            <ChronicleSwitcher />
          </div>
        </div>

        {/* Perfil & Ações */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-zinc-900/70 border border-zinc-800/60 px-2.5 py-1 rounded-full">
            <Avatar className="w-6 h-6 border border-red-900/40">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-300">
                {(profile?.username || user?.email || "P").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-zinc-200 hidden sm:inline-block pr-1">
              {profile?.username || user?.user_metadata?.username || "Neófito"}
            </span>
          </div>

          <button
            onClick={signOut}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-md transition-colors"
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Barra de Navegação Rápida da Coterie */}
      <nav className="border-b border-border/30 bg-[#050507]/95 px-4 sm:px-6 sticky top-16 z-30 overflow-x-auto">
        <div className="flex items-center gap-2 max-w-6xl mx-auto py-2">
          {playerNavigation.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-zinc-100 hover:bg-zinc-900/60 transition-all border border-transparent whitespace-nowrap"
              activeClassName="bg-red-950/40 text-red-300 border-red-900/50 shadow-[0_0_10px_rgba(185,28,28,0.2)]"
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Conteúdo Principal do Jogador */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto overflow-auto">
        <Outlet />
      </main>

      {/* Widgets do Sistema V5 (Fome, Dados e Fúria da Besta) */}
      <BeastWidget />
      <DiceRollerWidget />
    </div>
  );
}
