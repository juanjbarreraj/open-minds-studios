import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SiteHeader from '../components/landing/SiteHeader';
import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import ServicesSection from '../components/landing/ServicesSection';
import PortalSection from '../components/landing/PortalSection';

import TestimonialsSection from '../components/landing/TestimonialsSection';
import TestSupportSection from '../components/landing/TestSupportSection';
import AcademicSupportSection from '../components/landing/AcademicSupportSection';
import ConsultationCTA from '../components/landing/ConsultationCTA';
import ContactSection from '../components/landing/ContactSection';
import SiteFooter from '../components/landing/SiteFooter';

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const attempt = (retries) => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (retries > 0) {
          setTimeout(() => attempt(retries - 1), 150);
        }
      };
      attempt(5);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <SiteHeader />
      <main>
        <HeroSection />
        <TestSupportSection />
        <AcademicSupportSection />
        <AboutSection />
        <ServicesSection />
        <PortalSection />
        <TestimonialsSection />
        <ConsultationCTA />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}