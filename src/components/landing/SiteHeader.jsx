import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SiteLogo from '../shared/SiteLogo';
import { useIntroTiming, useMotion, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'About', href: '/about', isPage: true },
  { label: 'Services', href: '/services', isPage: true },
  { label: 'Student Portal', anchor: 'student-portal' },
  { label: 'Results', anchor: 'results' },
  { label: 'Tiers', href: '/subscription-plans', isPage: true },
  { label: 'Contact', href: '/contact', isPage: true },
];

/**
 * A navigation link with an animated underline: it grows from the left on
 * hover and stays fully drawn on the active route. Colour never switches
 * abruptly; both colour and underline ease over 200ms.
 */
function AnimatedNavLink({ to = '', onClick = undefined, active = false, children = null, as = /** @type {any} */ (Link) }) {
  /** @type {any} */
  const Comp = as;
  const props = Comp === Link ? { to } : { href: to };
  return (
    <Comp
      {...props}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative py-1.5 text-sm font-medium transition-colors duration-fast ease-brand-out',
        active ? 'text-brand-blue-deep' : 'text-ink-600 hover:text-brand-blue-deep'
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-brand-blue transition-transform duration-hover ease-brand-out',
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        )}
      />
    </Comp>
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const intro = useIntroTiming();
  const m = useMotion();

  const isHome = location.pathname === '/' || location.pathname === '/Home';

  // Anchor links scroll in place on the landing page, navigate home otherwise.
  const handleAnchor = (hash) => (e) => {
    e.preventDefault();
    setMobileOpen(false);
    if (isHome) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${hash}`);
    }
  };

  // The staggered nav entrance belongs to the landing intro only; on every
  // other page the header is simply present.
  const navMotion = (i) => (isHome ? intro.navItem(i) : {});

  return (
    <motion.header
      {...(isHome ? intro.headerShell : {})}
      className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur-md"
    >
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <SiteLogo />

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l, i) => (
            <motion.div key={l.label} {...navMotion(i)}>
              {l.isPage ? (
                <AnimatedNavLink to={l.href} active={location.pathname === l.href}>
                  {l.label}
                </AnimatedNavLink>
              ) : (
                <AnimatedNavLink as="a" to={`/#${l.anchor}`} onClick={handleAnchor(l.anchor)} active={false}>
                  {l.label}
                </AnimatedNavLink>
              )}
            </motion.div>
          ))}

          {/* Differentiated from plain navigation: a filled, layered CTA. */}
          <motion.div {...navMotion(LINKS.length)}>
            <motion.span whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link
                to="/contact"
                className="inline-flex min-h-[40px] items-center rounded-full px-5 text-sm font-semibold text-white transition-[filter] duration-fast ease-brand-out hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0) 45%), linear-gradient(180deg, rgb(110,205,175) 0%, rgb(78,175,145) 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 5px 14px -5px rgba(78,175,145,0.6)',
                }}
              >
                Book Consultation
              </Link>
            </motion.span>
          </motion.div>
        </div>

        {/* Mobile toggle: a real 44px target with state announced. */}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-700 transition-colors duration-fast hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={m.reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={m.reduced ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={m.reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 pb-5 pt-3">
              {LINKS.map((l) =>
                l.isPage ? (
                  <Link
                    key={l.label}
                    to={l.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={location.pathname === l.href ? 'page' : undefined}
                    className={cn(
                      'rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-fast',
                      location.pathname === l.href
                        ? 'bg-brand-blue/10 text-brand-blue-deep'
                        : 'text-ink-600 hover:bg-slate-50 hover:text-ink-900'
                    )}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.label}
                    href={`/#${l.anchor}`}
                    onClick={handleAnchor(l.anchor)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors duration-fast hover:bg-slate-50 hover:text-ink-900"
                  >
                    {l.label}
                  </a>
                )
              )}
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-semibold text-white"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0) 45%), linear-gradient(180deg, rgb(110,205,175) 0%, rgb(78,175,145) 100%)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 5px 14px -5px rgba(78,175,145,0.6)',
                }}
              >
                Book Consultation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
