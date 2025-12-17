/**
 * Configurações de animações com Framer Motion
 * Sistema padronizado de animações para GESTÃO ZEN
 */

import { Variants } from 'framer-motion';

// Durações padrão (em segundos)
export const duration = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

// Easings personalizados
export const easing = {
  smooth: [0.6, -0.05, 0.01, 0.99],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 400, damping: 10 },
} as const;

/**
 * FADE IN
 * Fade in simples com opacity
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal },
  },
};

/**
 * FADE IN UP
 * Fade in com movimento de baixo para cima
 */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

/**
 * FADE IN DOWN
 * Fade in com movimento de cima para baixo
 */
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

/**
 * SCALE UP
 * Escala de 0.95 para 1 com fade in
 */
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

/**
 * SLIDE IN LEFT
 * Desliza da esquerda com fade in
 */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

/**
 * SLIDE IN RIGHT
 * Desliza da direita com fade in
 */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
};

/**
 * STAGGER CONTAINER
 * Container para criar efeito de stagger (cascata)
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * STAGGER ITEM
 * Item individual para usar dentro de staggerContainer
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.fast,
      ease: easing.smooth,
    },
  },
};

/**
 * CARD HOVER
 * Efeito de hover para cards
 */
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: duration.fast,
      ease: easing.smooth,
    },
  },
};

/**
 * BUTTON HOVER
 * Efeito de hover para botões
 */
export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: duration.fast,
      ease: easing.smooth,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * BUTTON PRESS
 * Efeito de press para botões
 */
export const buttonPress = {
  scale: 0.95,
  transition: {
    duration: 0.1,
  },
};

/**
 * PAGE TRANSITION
 * Transição entre páginas
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * DIALOG TRANSITION
 * Transição para dialogs/modals
 */
export const dialogTransition: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.fast,
      ease: easing.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: duration.fast,
    },
  },
};

/**
 * PULSE
 * Animação de pulse para alertas
 */
export const pulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

/**
 * SHAKE
 * Animação de shake para erros
 */
export const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
  },
};

/**
 * SUCCESS CHECKMARK
 * Animação de checkmark de sucesso
 */
export const successCheckmark: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: easing.smooth },
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * LOADING SPINNER
 * Animação de spinner de loading
 */
export const loadingSpinner = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

/**
 * NUMBER COUNTER
 * Configuração para animação de contadores
 */
export const numberCounter = {
  duration: 1.5,
  ease: 'easeOut',
};

/**
 * HELPER: Verifica se deve usar animações reduzidas
 * Respeita prefers-reduced-motion para acessibilidade
 */
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * HELPER: Retorna variantes condicionalmente
 * Usa animações normais ou desabilitadas baseado em prefers-reduced-motion
 */
export const getVariants = (variants: Variants): Variants => {
  if (shouldReduceMotion()) {
    return {
      hidden: {},
      visible: {},
    };
  }
  return variants;
};
