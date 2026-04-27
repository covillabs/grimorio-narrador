import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
