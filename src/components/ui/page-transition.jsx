import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useMotion } from '@/lib/motion';

/**
 * Route level transition.
 *
 * Deliberately short (260ms in) so navigation never feels held up, and it
 * animates opacity and transform only, so there is no white flash between
 * pages. Scroll is reset on a route change unless the URL carries a hash,
 * in which case the page's own anchor handling takes over.
 */
export default function PageTransition({ children = null, className = '' }) {
  const m = useMotion();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={m.page}
      className={className}
    >
      {children}
    </motion.div>
  );
}
