// Shared Framer Motion vocabulary.
//
// Every animated surface in the product pulls its variants from here rather
// than defining its own, so the motion has one personality: responsive,
// smooth, medium speed, controlled. Timings follow the UX guidance that
// micro-interactions stay under 300ms and only full section reveals approach
// 600ms.
//
// Reduced motion is handled once, in `useMotion()`. When the user asks for
// less motion every variant collapses to a short opacity change with no
// translation, no scale, and no stagger, while all functionality stays.
import { useReducedMotion } from 'framer-motion';

// Premium easing. Never linear: entering eases out, leaving eases in.
export const EASE_OUT = [0.22, 1, 0.36, 1];
export const EASE_IN = [0.64, 0, 0.78, 0];
export const EASE_INOUT = [0.65, 0, 0.35, 1];

export const DUR = {
  press: 0.12,
  fast: 0.18,
  hover: 0.22,
  modal: 0.3,
  section: 0.52,
};

export const STAGGER = 0.07;

// --- Building blocks -------------------------------------------------------

const fadeRise = (distance, duration, delay) => ({
  hidden: { opacity: 0, y: distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: EASE_OUT, delay },
  },
});

const fadeOnly = (duration = DUR.fast, delay = 0) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration, ease: EASE_OUT, delay } },
});

/**
 * The single hook every animated component uses.
 *
 * Returns ready-made variants plus `reduced`, so a component can also skip
 * decorative work (a looping shimmer, a parallax offset) rather than merely
 * shortening it.
 */
export function useMotion() {
  const reduced = useReducedMotion();

  if (reduced) {
    const instant = fadeOnly(0.15);
    return {
      reduced: true,
      // Entrances still fade so a change of state remains perceptible.
      page: instant,
      section: instant,
      item: instant,
      card: instant,
      modal: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      },
      backdrop: instant,
      // Containers still orchestrate children, just without a delay ladder.
      container: { hidden: {}, visible: { transition: { staggerChildren: 0 } } },
      // No movement on hover or press; the CSS focus ring and colour change
      // still communicate interactivity.
      hover: {},
      tap: {},
      lift: {},
      viewport: { once: true, amount: 0.01 },
    };
  }

  return {
    reduced: false,

    // Route level. Short enough that navigation never feels delayed.
    page: {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_OUT } },
      exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: EASE_IN } },
    },

    // A whole section arriving as the page scrolls.
    section: fadeRise(24, DUR.section, 0),

    // A single item inside a staggered container.
    item: fadeRise(16, 0.42, 0),

    // A card in a grid; slightly scaled so a row of them reads as one wave.
    card: {
      hidden: { opacity: 0, y: 18, scale: 0.985 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.42, ease: EASE_OUT },
      },
    },

    // Orchestrates children. Pair with `item` or `card`.
    container: {
      hidden: {},
      visible: { transition: { staggerChildren: STAGGER, delayChildren: 0.04 } },
    },

    // Dialogs and panels.
    modal: {
      hidden: { opacity: 0, scale: 0.97, y: 12 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: DUR.modal, ease: EASE_OUT } },
      exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: 0.2, ease: EASE_IN } },
    },
    backdrop: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: DUR.hover } },
      exit: { opacity: 0, transition: { duration: 0.16 } },
    },

    // Interaction. Transform only, so these stay on the compositor.
    hover: { y: -3, transition: { duration: DUR.hover, ease: EASE_OUT } },
    tap: { scale: 0.985, transition: { duration: DUR.press, ease: EASE_OUT } },
    lift: { y: -4, transition: { duration: DUR.hover, ease: EASE_OUT } },

    // Reveal once, when a reasonable slice of the element is on screen.
    viewport: { once: true, amount: 0.15, margin: '0px 0px -80px 0px' },
  };
}

/**
 * Props for a section that reveals on scroll. Spread onto a motion element.
 *
 *   <motion.section {...revealProps(m)}>
 */
export const revealProps = (m, variants) => ({
  initial: 'hidden',
  whileInView: 'visible',
  viewport: m.viewport,
  variants: variants || m.section,
});

/**
 * Props for a staggered group. Children use `variants={m.item}` or `m.card`.
 */
export const staggerProps = (m) => ({
  initial: 'hidden',
  whileInView: 'visible',
  viewport: m.viewport,
  variants: m.container,
});

/**
 * Props for content that animates as soon as it mounts, for a panel that has
 * just been opened rather than scrolled to.
 */
export const enterProps = (m, variants) => ({
  initial: 'hidden',
  animate: 'visible',
  variants: variants || m.item,
});
