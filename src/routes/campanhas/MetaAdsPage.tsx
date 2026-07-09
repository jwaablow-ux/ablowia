import { ContaNaoConectada } from "./ContaNaoConectada";

export function MetaAdsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-semibold mb-2">Campanhas — Meta Ads</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Métricas de campanhas do Facebook e Instagram Ads aparecerão aqui assim que uma conta de anúncio do
        Ablaw for conectada.
      </p>
      <ContaNaoConectada plataforma="Meta Ads" />
    </div>
  );
}
