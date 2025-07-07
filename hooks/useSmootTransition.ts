import { useState, useCallback, useRef } from "react";

/**
 * Hook para gerenciar transições suaves em componentes
 * Útil para evitar flickering durante mudanças de estado
 */
export function useSmoothTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const startTransition = useCallback((duration: number = 300) => {
    setIsTransitioning(true);

    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Definir um timeout para finalizar a transição
    timeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, duration);
  }, []);

  const endTransition = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsTransitioning(false);
  }, []);

  // Cleanup no unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    isTransitioning,
    startTransition,
    endTransition,
    cleanup,
  };
}
