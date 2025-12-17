"use client";

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';
import type { Variants } from 'framer-motion';

// Importação dinâmica do Framer Motion com code splitting
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: true }
);

const MotionSpan = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.span),
  { ssr: true }
);

const MotionTr = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.tr),
  { ssr: true }
);

const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.button),
  { ssr: true }
);

// Tipos para propriedades dos componentes animados
interface AnimatedComponentProps {
  children: ReactNode;
  variants?: Variants | undefined;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  className?: string;
  whileHover?: any;
  whileTap?: any;
  viewport?: any;
  onViewportEnter?: () => void;
  onViewportLeave?: () => void;
  [key: string]: any;
}

/**
 * Componente animado otimizado para divs
 * Usa code splitting para carregar Framer Motion sob demanda
 */
export function AnimatedDiv({
  children,
  variants,
  initial = 'hidden',
  animate = 'visible',
  exit,
  transition,
  className,
  whileHover,
  whileTap,
  viewport,
  onViewportEnter,
  onViewportLeave,
  ...props
}: AnimatedComponentProps) {
  return (
    <MotionDiv
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
      whileHover={whileHover}
      whileTap={whileTap}
      viewport={viewport}
      onViewportEnter={onViewportEnter}
      onViewportLeave={onViewportLeave}
      {...props}
    >
      {children}
    </MotionDiv>
  );
}

/**
 * Componente animado otimizado para spans
 * Útil para animações de texto inline
 */
export function AnimatedSpan({
  children,
  variants,
  initial = 'hidden',
  animate = 'visible',
  exit,
  transition,
  className,
  whileHover,
  whileTap,
  ...props
}: AnimatedComponentProps) {
  return (
    <MotionSpan
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </MotionSpan>
  );
}

/**
 * Componente animado otimizado para table rows
 * Ideal para listas e tabelas com efeito stagger
 */
export function AnimatedTableRow({
  children,
  variants,
  initial = 'hidden',
  animate = 'visible',
  exit,
  transition,
  className,
  whileHover,
  viewport,
  onViewportEnter,
  ...props
}: AnimatedComponentProps) {
  return (
    <MotionTr
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
      whileHover={whileHover}
      viewport={viewport}
      onViewportEnter={onViewportEnter}
      {...props}
    >
      {children}
    </MotionTr>
  );
}

/**
 * Componente animado otimizado para botões
 * Inclui efeitos hover e tap nativamente
 */
export function AnimatedButton({
  children,
  variants,
  initial,
  animate,
  exit,
  transition,
  className,
  whileHover = { scale: 1.05 },
  whileTap = { scale: 0.95 },
  ...props
}: AnimatedComponentProps) {
  return (
    <MotionButton
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      {children}
    </MotionButton>
  );
}

/**
 * Container para animações stagger
 * Carrega dinamicamente e aplica delay entre child elements
 */
export function StaggerContainer({
  children,
  className,
  delay = 0.1,
  ...props
}: AnimatedComponentProps & { delay?: number }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  };

  return (
    <AnimatedDiv
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </AnimatedDiv>
  );
}
