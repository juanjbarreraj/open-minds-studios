import React from 'react';
import { motion } from 'framer-motion';

/**
 * The full Open Minds Studios brand mark (icon plus wordmark), sized
 * responsively with a maximum width so it stays sharp and proportional on
 * large screens. It never rotates, bounces, or morphs: at rest it is clean
 * and still.
 *
 * The entrance and the soft one-shot halo behind it are driven by the caller
 * through `logoMotion` and `glowMotion` (see useIntroTiming), so the timing
 * lives in one place.
 */
export default function AnimatedLogo({ logoMotion = {}, glowMotion = {} }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Soft halo that swells once during the intro and fades into nothing.
          Purely decorative, so it is hidden from assistive tech. */}
      <motion.div
        aria-hidden="true"
        {...glowMotion}
        className="pointer-events-none absolute h-[130%] w-[130%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(98,191,161,0.22) 0%, rgba(58,154,202,0.14) 40%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />

      <motion.img
        {...logoMotion}
        src="/assets/logo-no-background.png"
        alt="Open Minds Studios"
        width="720"
        height="480"
        className="relative w-[min(80vw,560px)] select-none object-contain md:w-[min(60vw,620px)]"
        draggable="false"
      />
    </div>
  );
}
