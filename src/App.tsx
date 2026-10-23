import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { PlayerLayout } from "@/components/PlayerLayout";

// Páginas de Autenticação & Onboarding
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import LobbyPage from "@/pages/LobbyPage";
import NotFound from "@/pages/NotFound";

// Páginas do Narrador
import HomePage from "@/pages/HomePage";
import CoteriePage from "@/pages/CoteriePage";
import NpcsPage from "@/pages/NpcsPage";
import TeiaPage from "@/pages/TeiaPage";
import ArsenalPage from "@/pages/ArsenalPage";
import AtlasPage from "@/pages/AtlasPage";
import OcultismoPage from "@/pages/OcultismoPage";
import QuestsPage from "@/pages/QuestsPage";
import DiarioPage from "@/pages/DiarioPage";
import EscudoPage from "@/pages/EscudoPage";
import BoonsPage from "@/pages/BoonsPage";
import CombatePage from "@/pages/CombatePage";
import OraclePage from "@/pages/OraclePage";

// Página Inicial do Jogador
import PlayerDashboardPage from "@/pages/PlayerDashboardPage";

const queryClient = new QueryClient();

// Componente de Chaveamento Inteligente na Raiz "/"
function RoleBasedHome() {
  const { user, hasChronicle, isPlayer, loading } = useAuth();
  if (loading) return null;
  // Se não tem crônica ativa e não é convidado, vai para o saguão (Lobby)
  if (!hasChronicle && user?.app_metadata?.provider !== "guest") {
    return <Navigate to="/lobby" replace />;
  }
  // Se for jogador na crônica ativa, vai para a visão do jogador
  if (isPlayer) return <Navigate to="/player" replace />;
  // Se for narrador na crônica ativa, exibe HomePage
  return <HomePage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* 2. Saguão / Onboarding (Requer apenas login) */}
            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <LobbyPage />
                </ProtectedRoute>
              }
            />

            {/* 3. Rotas do Narrador (Role: 'narrator' na crônica ativa) */}
            <Route element={<ProtectedRoute allowedRoles={["narrator"]} />}>
              <Route element={<Layout />}>
                <Route path="/" element={<RoleBasedHome />} />
                <Route path="/coterie" element={<CoteriePage />} />
                <Route path="/npcs" element={<NpcsPage />} />
                <Route path="/teia" element={<TeiaPage />} />
                <Route path="/arsenal" element={<ArsenalPage />} />
                <Route path="/atlas" element={<AtlasPage />} />
                <Route path="/ocultismo" element={<OcultismoPage />} />
                <Route path="/quests" element={<QuestsPage />} />
                <Route path="/diario" element={<DiarioPage />} />
                <Route path="/boons" element={<BoonsPage />} />
                <Route path="/combate" element={<CombatePage />} />
                <Route path="/escudo" element={<EscudoPage />} />
                <Route path="/oracle" element={<OraclePage />} />
              </Route>
            </Route>

            {/* 4. Rotas do Jogador (Role: 'player' na crônica ativa) */}
            <Route path="/player" element={<ProtectedRoute allowedRoles={["player"]} />}>
              <Route element={<PlayerLayout />}>
                <Route index element={<PlayerDashboardPage />} />
                <Route path="coterie" element={<PlayerDashboardPage tab="coterie" />} />
                <Route path="codex" element={<PlayerDashboardPage tab="codex" />} />
                <Route path="boons" element={<PlayerDashboardPage tab="boons" />} />
              </Route>
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
