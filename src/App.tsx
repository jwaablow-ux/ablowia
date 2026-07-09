import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthProvider";
import { RequireAuth } from "./components/auth/RequireAuth";
import { Sidebar } from "./components/layout/Sidebar";
import { InstanciasPage } from "./routes/configuracoes/instancias/InstanciasPage";
import { ConfigurarIAPage } from "./routes/configuracoes/configurar-ia/ConfigurarIAPage";
import { UsuariosPage } from "./routes/configuracoes/usuarios/UsuariosPage";
import { ModeloIAPage } from "./routes/configuracoes/modelo-ia/ModeloIAPage";
import { DashboardPage } from "./routes/dashboard/DashboardPage";
import { MetaAdsPage } from "./routes/campanhas/MetaAdsPage";
import { GoogleAdsPage } from "./routes/campanhas/GoogleAdsPage";
import { GruposPage } from "./routes/grupos/GruposPage";
import { ClientesPage } from "./routes/clientes/ClientesPage";
import { LoginPage } from "./routes/login/LoginPage";

const queryClient = new QueryClient();

function AreaAutenticada() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface sticky top-0 z-30">
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="text-brand-text p-1 -ml-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <div className="text-sm font-semibold tracking-wide">
            <span className="text-brand-accent">AB</span>LAW IA
          </div>
          <div className="w-6" />
        </header>
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/campanhas/meta-ads" element={<MetaAdsPage />} />
            <Route path="/campanhas/google-ads" element={<GoogleAdsPage />} />
            <Route path="/grupos" element={<GruposPage />} />
            <Route path="/configuracoes/instancias" element={<InstanciasPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/configuracoes/configurar-ia" element={<ConfigurarIAPage />} />
            <Route path="/configuracoes/usuarios" element={<UsuariosPage />} />
            <Route path="/configuracoes/modelo-ia" element={<ModeloIAPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AreaAutenticada />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
