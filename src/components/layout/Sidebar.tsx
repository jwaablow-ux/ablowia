import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-brand-border bg-brand-surface h-screen p-4">
      <div className="mb-6 px-2 text-lg font-semibold tracking-wide">
        <span className="text-brand-accent">AB</span>LAW IA
      </div>
      <nav className="flex flex-col gap-1">
        <div className="px-2 pt-2 pb-1 text-xs font-medium uppercase tracking-widest text-brand-muted">
          Configurações
        </div>
        <NavLink
          to="/configuracoes/instancias"
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm font-medium ${
              isActive
                ? "bg-brand-accent/15 text-brand-accent border border-brand-accent/40"
                : "text-brand-text/80 hover:bg-brand-surface-hover"
            }`
          }
        >
          Instâncias
        </NavLink>
      </nav>
    </aside>
  );
}
