import React from 'react';
import { FileText } from 'lucide-react';
import SiteHeader from '../components/landing/SiteHeader';
import SiteFooter from '../components/landing/SiteFooter';
import ChapterSection from '../components/guide/ChapterSection';
import { chapters, PDF_URL } from '../components/guide/guideData';

export default function Guide() {
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
              User Journeys
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl" style={{
              background: 'linear-gradient(135deg, rgb(30,90,140) 0%, rgb(58,154,202) 45%, rgb(98,191,161) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Step-by-Step Guide
            </h1>
            <p className="mt-4 text-base text-slate-500">
              Everything you need to get started with Open Minds Studios — for students, parents, tutors, and managers.
            </p>
            <a
              href={PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
              style={{ backgroundColor: 'rgb(98,191,161)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgb(70,165,135)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgb(98,191,161)'}
            >
              <FileText className="h-4 w-4" />
              Open the full PDF guide
            </a>
          </div>
        </section>

        <section className="px-6 py-14">
          <div className="mx-auto max-w-3xl space-y-16">
            {chapters.map((chapter) => (
              <ChapterSection key={chapter.id} chapter={chapter} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}