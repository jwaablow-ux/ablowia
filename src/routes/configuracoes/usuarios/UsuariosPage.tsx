import { useState } from "react";
import { useUsuarios } from "../../../lib/useUsuarios";
import type { Papel } from "../../../types/perfil";
import { CriarUsuarioModal } from "./CriarUsuarioModal";

const rotuloPapel: Record<Papel, string> = {
  admin: "Administrador",
  comum: "Usuário comum",
};

export function UsuariosPage() {
  const { usuarios, carregando, erro, criarUsuario, alterarPapel } = useUsuarios();
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-xl font-semibold">Gerenciador de Usuários</h1>
        <button
          onClick={() => setModalCriarAberto(true)}
          className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accent-hover"
        >
          + Criar Usuário
        </button>
      </div>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Administradores têm acesso total ao painel. Usuários comuns podem ser restringidos futuramente
        conforme novas áreas forem criadas.
      </p>

      {carregando ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Carregando...
        </div>
      ) : erro ? (
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-6 text-sm text-red-300">
          Não foi possível carregar os usuários: {erro instanceof Error ? erro.message : "erro desconhecido"}
        </div>
      ) : usuarios.length === 0 ? (
        <div className="border border-dashed border-brand-border rounded-lg p-10 text-center text-sm text-brand-muted">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="border border-brand-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-surface text-left">
              <tr>
                <th className="px-4 py-2 font-medium">E-mail</th>
                <th className="px-4 py-2 font-medium">Papel</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-brand-border">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{rotuloPapel[u.papel]}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => alterarPapel(u.id, u.papel === "admin" ? "comum" : "admin")}
                      className="text-sm text-brand-accent underline"
                    >
                      Tornar {u.papel === "admin" ? "usuário comum" : "administrador"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCriarAberto && (
        <CriarUsuarioModal
          onFechar={() => setModalCriarAberto(false)}
          onCriar={async (email, senha, papel) => {
            await criarUsuario(email, senha, papel);
            setModalCriarAberto(false);
          }}
        />
      )}
    </div>
  );
}
