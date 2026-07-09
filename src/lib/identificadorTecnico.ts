export function gerarIdentificadorTecnico(nomeServico: string): string {
  const slug = nomeServico
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sufixo = crypto.randomUUID().split("-")[0];

  return `${slug || "servico"}-${sufixo}`;
}
