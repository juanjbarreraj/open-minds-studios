import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="border-t" style={{ backgroundColor: '#0f1f2e', borderColor: 'rgba(58,154,202,0.2)' }}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm md:flex-row" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <div className="font-semibold text-white">Open Minds Studios</div>
        <div className="flex flex-wrap items-center gap-6">
          {['About','Services','Portal','Contact'].map((label, i) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgb(98,191,161)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
            >{label}</a>
          ))}
          <Link
            to="/privacy-policy"
            className="transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgb(98,191,161)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >Privacy Policy</Link>
          <Link
            to="/terms-of-service"
            className="transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgb(98,191,161)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >Terms of Service</Link>
          <Link
            to="/payment-policy"
            className="transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgb(98,191,161)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >Payment Policy</Link>
          <Link
            to="/guide"
            className="transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgb(98,191,161)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >Step-by-Step Guide</Link>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)' }}>© {new Date().getFullYear()} Open Minds Studios</div>
      </div>
    </footer>
  );
}