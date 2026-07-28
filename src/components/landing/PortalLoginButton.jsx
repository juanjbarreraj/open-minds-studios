import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * The two portal entry buttons on the landing intro. Tactile and layered
 * rather than flat rectangles: a two-stop brand gradient, a bright highlight
 * along the top edge, a faint internal glow, and multi-layer shadows that
 * deepen on hover. Motion is transform only.
 */
const THEMES = {
  student: {
    fill: 'linear-gradient(180deg, rgb(112,206,176) 0%, rgb(76,172,142) 100%)',
    shadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 10px 24px -8px rgba(76,172,142,0.65), 0 3px 8px rgba(15,23,42,0.14)',
    hoverShadow: '0 1px 0 rgba(255,255,255,0.45) inset, 0 18px 34px -10px rgba(76,172,142,0.8), 0 6px 14px rgba(15,23,42,0.16)',
    ring: 'rgb(60,160,130)',
  },
  tutor: {
    fill: 'linear-gradient(180deg, rgb(80,170,216) 0%, rgb(48,130,184) 100%)',
    shadow: '0 1px 0 rgba(255,255,255,0.32) inset, 0 10px 24px -8px rgba(48,130,184,0.65), 0 3px 8px rgba(15,23,42,0.14)',
    hoverShadow: '0 1px 0 rgba(255,255,255,0.42) inset, 0 18px 34px -10px rgba(48,130,184,0.8), 0 6px 14px rgba(15,23,42,0.16)',
    ring: 'rgb(40,120,170)',
  },
};

export default function PortalLoginButton({ theme = 'student', icon: Icon = null, children = null, motionProps = {}, onClick = undefined }) {
  const t = THEMES[theme];
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ y: 0, scale: 0.98, transition: { duration: 0.12 } }}
      {...motionProps}
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0) 45%), ${t.fill}`,
        boxShadow: hovered ? t.hoverShadow : t.shadow,
        outlineColor: t.ring,
      }}
      className="group relative inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-8 text-base font-semibold text-white transition-[filter] duration-hover ease-brand-out hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto sm:min-w-[210px]"
    >
      {/* Faint internal sheen that brightens slightly on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl opacity-60 transition-opacity duration-hover group-hover:opacity-90"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22), transparent)' }}
      />
      {Icon && <Icon className="relative h-5 w-5 shrink-0" aria-hidden="true" />}
      <span className="relative">{children}</span>
      <ArrowRight
        className="relative h-4 w-4 shrink-0 opacity-90 transition-transform duration-hover ease-brand-out group-hover:translate-x-1"
        aria-hidden="true"
      />
    </motion.button>
  );
}
