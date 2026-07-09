import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/layout/Sidebar";
import { InstanciasPage } from "./routes/configuracoes/instancias/InstanciasPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/configuracoes/instancias" replace />} />
            <Route path="/configuracoes/instancias" element={<InstanciasPage />} />
          </Routes>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
