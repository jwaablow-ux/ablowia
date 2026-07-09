import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectarIOS(): boolean {
  const ua = window.navigator.userAgent;
  const iosClassico = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se identifica como Mac, então detectamos por suporte a touch.
  const iPadOS = ua.includes("Macintosh") && "ontouchend" in document;
  return iosClassico || iPadOS;
}

function detectarStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [eventoDisponivel, setEventoDisponivel] = useState<BeforeInstallPromptEvent | null>(null);
  const [jaInstalado, setJaInstalado] = useState(() => detectarStandalone());
  const isIOS = detectarIOS();

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setEventoDisponivel(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);

    function handlerInstalado() {
      setJaInstalado(true);
      setEventoDisponivel(null);
    }
    window.addEventListener("appinstalled", handlerInstalado);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handlerInstalado);
    };
  }, []);

  async function instalar() {
    if (!eventoDisponivel) return;
    await eventoDisponivel.prompt();
    await eventoDisponivel.userChoice;
    setEventoDisponivel(null);
  }

  return {
    podeInstalarAgora: !!eventoDisponivel && !jaInstalado,
    mostrarInstrucaoIOS: isIOS && !jaInstalado,
    jaInstalado,
    instalar,
  };
}
