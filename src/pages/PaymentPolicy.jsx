import React from 'react';
import SiteHeader from '../components/landing/SiteHeader';
import SiteFooter from '../components/landing/SiteFooter';
import PaymentPolicyContent from '../components/legal/PaymentPolicyContent';

export default function PaymentPolicy() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 px-6" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(98,191,161,0.1) 0%, rgba(58,154,202,0.06) 50%, #f8fafc 100%)',
        }}>
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: 'rgba(98,191,161,0.12)', color: 'rgb(60,160,130)' }}>
              Legal
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl" style={{
              background: 'linear-gradient(135deg, rgb(30,90,140) 0%, rgb(58,154,202) 45%, rgb(98,191,161) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Payment &amp; Cancellation Policy
            </h1>
            <p className="mt-4 text-sm text-ink-500">
              Effective Date: January 1, 2026
            </p>
          </div>
        </section>

        <section className="px-6 py-12">
          <PaymentPolicyContent />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}