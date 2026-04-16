import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import CoteriePage from "@/pages/CoteriePage";
import NpcsPage from "@/pages/NpcsPage";
import TeiaPage from "@/pages/TeiaPage";
import ArsenalPage from "@/pages/ArsenalPage";
import AtlasPage from "@/pages/AtlasPage";
import OcultismoPage from "@/pages/OcultismoPage";
import DiarioPage from "@/pages/DiarioPage";
import EscudoPage from "@/pages/EscudoPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/coterie" element={<CoteriePage />} />
            <Route path="/npcs" element={<NpcsPage />} />
            <Route path="/teia" element={<TeiaPage />} />
            <Route path="/arsenal" element={<ArsenalPage />} />
            <Route path="/atlas" element={<AtlasPage />} />
            <Route path="/ocultismo" element={<OcultismoPage />} />
            <Route path="/diario" element={<DiarioPage />} />
            <Route path="/escudo" element={<EscudoPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
