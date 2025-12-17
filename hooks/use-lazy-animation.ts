"use client";

import { useEffect, useState, useRef, RefObject } from 'react';

interface UseLazyAnimationOptions {
  threshold?: number; // Porcentagem do elemento visível para trigger (0-1)
  rootMargin?: string; // Margem ao redor do viewport
  triggerOnce?: boolean; // Se true, anima apenas uma vez
  delay?: number; // Delay antes de iniciar animação (ms)
}

/**
 * Hook personalizado para lazy loading de animações
 * Usa Intersection Observer para detectar quando elemento entra no viewport
 * Reduz bundle size inicial carregando animações apenas quando necessário
 * 
 * @example
 * const { ref, shouldAnimate } = useLazyAnimation();
 * return (
 *   <div ref={ref}>
 *     {shouldAnimate && <HeavyAnimatedComponent />}
 *   </div>
 * );
 */
export function useLazyAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyAnimationOptions = {}
): {
  ref: RefObject<T>;
  shouldAnimate: boolean;
  isVisible: boolean;
} {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Verifica se o browser suporta IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: anima imediatamente se não houver suporte
      setShouldAnimate(true);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Se triggerOnce estiver ativo e já foi ativado, não faz nada
            if (triggerOnce && hasTriggered.current) return;
            
            // Aplica delay se configurado
            if (delay > 0) {
              setTimeout(() => {
                setShouldAnimate(true);
                hasTriggered.current = true;
              }, delay);
            } else {
              setShouldAnimate(true);
              hasTriggered.current = true;
            }
          } else {
            setIsVisible(false);
            // Se não for triggerOnce, permite re-animação
            if (!triggerOnce) {
              setShouldAnimate(false);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return { ref, shouldAnimate, isVisible };
}

/**
 * Hook simplificado para prefers-reduced-motion
 * Detecta preferência de acessibilidade do usuário
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook para delay controlado de montagem de componentes
 * Útil para evitar carregar todas as animações simultaneamente
 */
export function useDelayedMount(delayMs: number = 100): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  return isMounted;
}

/**
 * Hook para carregar componentes pesados progressivamente
 * Útil para páginas com muitos elementos animados
 */
export function useProgressiveLoad(
  totalItems: number,
  batchSize: number = 5,
  delayBetweenBatches: number = 100
): number {
  const [visibleCount, setVisibleCount] = useState(batchSize);

  useEffect(() => {
    if (visibleCount >= totalItems) return;

    const timer = setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + batchSize, totalItems));
    }, delayBetweenBatches);

    return () => clearTimeout(timer);
  }, [visibleCount, totalItems, batchSize, delayBetweenBatches]);

  return visibleCount;
}
