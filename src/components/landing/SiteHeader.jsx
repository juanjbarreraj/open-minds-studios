import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SiteLogo from '../shared/SiteLogo';

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/' || location.pathname === '/Home';

  // For anchor links: scroll if on home, otherwise navigate to home with hash
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

  const links = [
    { label: 'About', href: '/about', isPage: true },
    { label: 'Services', href: '/services', isPage: true },
    { label: 'Student Portal', anchor: 'student-portal' },
    { label: 'Results', anchor: 'results' },
    { label: 'Tiers', href: '/subscription-plans', isPage: true },
    { label: 'Contact', href: '/contact', isPage: true },
  ];

  const linkCls = 'text-slate-600 transition-colors duration-200 hover:font-medium';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <SiteLogo />

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            l.isPage ? (
              <Link key={l.href} to={l.href}
                className={linkCls}
                onMouseEnter={e => e.currentTarget.style.color = 'rgb(58,154,202)'}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >
                {l.label}
              </Link>
            ) : (
              <a key={l.anchor} href={`/#${l.anchor}`}
                onClick={handleAnchor(l.anchor)}
                className={linkCls}
                onMouseEnter={e => e.currentTarget.style.color = 'rgb(58,154,202)'}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >
                {l.label}
              </a>
            )
          ))}
          <Link
            to="/contact"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
            style={{ backgroundColor: 'rgb(98,191,161)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
          >
            Book Consultation
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-6 pb-5 pt-3 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              l.isPage ? (
                <Link key={l.href} to={l.href} className="text-sm text-slate-600" onClick={() => setMobileOpen(false)}>
                  {l.label}
                </Link>
              ) : (
                <a key={l.anchor} href={`/#${l.anchor}`}
                  onClick={handleAnchor(l.anchor)}
                  className="text-sm text-slate-600"
                >
                  {l.label}
                </a>
              )
            ))}
            <Link
              to="/contact"
              className="mt-2 inline-block rounded-full px-5 py-2.5 text-center text-sm font-semibold text-white"
              style={{ backgroundColor: 'rgb(98,191,161)' }}
              onClick={() => setMobileOpen(false)}
            >
              Book Consultation
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}