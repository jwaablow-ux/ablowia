import { useMemo } from "react";

const CORES = ["#3fc6d4", "#33a9b5", "#f5f5f7", "#facc15", "#f472b6", "#4ade80"];

interface Peca {
  id: number;
  esquerda: number;
  atraso: number;
  duracao: number;
  cor: string;
  rotacaoInicial: number;
  largura: number;
  altura: number;
}

function criarPecas(quantidade: number): Peca[] {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: i,
    esquerda: Math.random() * 100,
    atraso: Math.random() * 0.5,
    duracao: 2.2 + Math.random() * 1.6,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    rotacaoInicial: Math.random() * 360,
    largura: 6 + Math.random() * 6,
    altura: 10 + Math.random() * 8,
  }));
}

/** Comemoração visual de confete caindo. Some sozinha (animação com fill-mode forwards). */
export function Confetti() {
  const pecas = useMemo(() => criarPecas(130), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      {pecas.map((p) => (
        <span
          key={p.id}
          className="absolute -top-4 rounded-sm animate-confetti-fall"
          style={{
            left: `${p.esquerda}%`,
            width: p.largura,
            height: p.altura,
            backgroundColor: p.cor,
            animationDelay: `${p.atraso}s`,
            animationDuration: `${p.duracao}s`,
            transform: `rotate(${p.rotacaoInicial}deg)`,
          }}
        />
      ))}
    </div>
  );
}
