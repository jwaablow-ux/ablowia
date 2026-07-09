// Ablaw IA — service worker mínimo, necessário para o navegador considerar o
// app instalável (PWA). Não faz cache agressivo de nada ainda — só o
// essencial para passar no critério de instalabilidade.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sem estratégia de cache por enquanto — deixa tudo passar direto pra rede.
});
