interface ContaNaoConectadaProps {
  plataforma: string;
}

export function ContaNaoConectada({ plataforma }: ContaNaoConectadaProps) {
  return (
    <div className="border border-dashed border-brand-border rounded-lg p-10 text-center max-w-xl">
      <p className="text-sm text-brand-muted mb-4">
        Nenhuma conta de {plataforma} conectada ainda para o Ablaw IA.
      </p>
      <button
        disabled
        title="Integração ainda não construída — conecte uma conta real do Ablaw para habilitar"
        className="px-3 py-2 text-sm rounded-md bg-brand-accent text-brand-bg font-semibold opacity-50 cursor-not-allowed"
      >
        Conectar conta
      </button>
    </div>
  );
}
