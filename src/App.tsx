import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./lib/AuthProvider";
import { RequireAuth } from "./components/auth/RequireAuth";
import { Sidebar } from "./components/layout/Sidebar";
import { InstanciasPage } from "./routes/configuracoes/instancias/InstanciasPage";
import { ConfigurarIAPage } from "./routes/configuracoes/configurar-ia/ConfigurarIAPage";
import { DashboardPage } from "./routes/dashboard/DashboardPage";
import { MetaAdsPage } from "./routes/campanhas/MetaAdsPage";
import { GoogleAdsPage } from "./routes/campanhas/GoogleAdsPage";
import { GruposPage } from "./routes/grupos/GruposPage";
import { LoginPage } from "./routes/login/LoginPage";

const queryClient = new QueryClient();

function AreaAutenticada() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/campanhas/meta-ads" element={<MetaAdsPage />} />
          <Route path="/campanhas/google-ads" element={<GoogleAdsPage />} />
          <Route path="/grupos" element={<GruposPage />} />
          <Route path="/configuracoes/instancias" element={<InstanciasPage />} />
          <Route path="/configuracoes/configurar-ia" element={<ConfigurarIAPage />} />
        </Routes>
      </main>
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
