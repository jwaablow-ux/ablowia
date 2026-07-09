import { ContaNaoConectada } from "./ContaNaoConectada";

export function GoogleAdsPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-2">Campanhas — Google Ads</h1>
      <p className="text-sm text-brand-muted mb-6 max-w-xl">
        Métricas de campanhas do Google Ads aparecerão aqui assim que uma conta de anúncio do Ablaw for
        conectada.
      </p>
      <ContaNaoConectada plataforma="Google Ads" />
    </div>
  );
}
