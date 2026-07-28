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
import { useRef } from 'react';
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

// --- Landing intro -----------------------------------------------------------

const INTRO_KEY = 'oms_intro_played';

/**
 * One cinematic entrance per browser session.
 *
 * The first time the landing page mounts this returns the full ~2.5s
 * choreography; navigating back from About, Contact, a closed modal, or a
 * dashboard returns a short fade instead, because sessionStorage already
 * carries the flag. Reduced motion collapses everything to a 0.2s fade and
 * nothing is ever interaction-blocking: each element is clickable as soon as
 * it is visible.
 *
 * Timeline (full run):
 *   0.00-0.40  background lighting and header shell fade in
 *   0.25-1.15  logo fades, rises, settles from 97% to 100% scale
 *   0.90-1.65  portal buttons rise in with a 180ms stagger
 *   1.40-2.50  header nav items finish their stagger; logo glow fades out
 */
export function useIntroTiming() {
  const reduced = useReducedMotion();

  // Resolve "is this the first landing view this session" exactly once per
  // mount, and mark the session so navigating back never replays the intro.
  const firstRunRef = useRef(null);
  if (firstRunRef.current === null) {
    let seen = true;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === '1';
      if (!seen) sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      seen = true; // storage unavailable: fall back to the quiet transition
    }
    firstRunRef.current = !seen;
  }
  const firstRun = firstRunRef.current;

  if (reduced) {
    const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } };
    return {
      firstRun: false,
      reduced: true,
      lighting: fade,
      logo: fade,
      glow: { initial: { opacity: 0 }, animate: { opacity: 0 } },
      button: () => fade,
      navItem: () => fade,
      headerShell: fade,
    };
  }

  if (!firstRun) {
    // Return visit within the session: quick, quiet.
    const quick = (delay = 0) => ({
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.28, delay, ease: EASE_OUT },
    });
    return {
      firstRun: false,
      reduced: false,
      lighting: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } },
      logo: quick(0.03),
      glow: { initial: { opacity: 0 }, animate: { opacity: 0 } },
      button: (i) => quick(0.08 + i * 0.05),
      navItem: () => ({ initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }),
      headerShell: { initial: { opacity: 1 }, animate: { opacity: 1 } },
    };
  }

  return {
    firstRun: true,
    reduced: false,
    lighting: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.9, ease: 'easeOut' },
    },
    headerShell: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    logo: {
      initial: { opacity: 0, y: 26, scale: 0.97 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.9, delay: 0.25, ease: EASE_OUT },
    },
    // A soft halo that swells behind the logo and disappears into the
    // resting state; the logo itself stays clean and still afterwards.
    glow: {
      initial: { opacity: 0 },
      animate: { opacity: [0, 0.55, 0] },
      transition: { duration: 2.2, times: [0, 0.5, 1], delay: 0.3, ease: 'easeInOut' },
    },
    button: (i) => ({
      initial: { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.55, delay: 0.9 + i * 0.18, ease: EASE_OUT },
    }),
    navItem: (i) => ({
      initial: { opacity: 0, y: -8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45, delay: 1.4 + i * 0.12, ease: EASE_OUT },
    }),
  };
}

