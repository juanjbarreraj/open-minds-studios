import React from 'react';
import JourneyCard from './JourneyCard';

export default function ChapterSection({ chapter }) {
  return (
    <section id={chapter.id} className="scroll-mt-24">
      <div className="border-l-4 pl-5" style={{ borderColor: 'rgb(58,154,202)' }}>
        <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgb(60,160,130)' }}>
          {chapter.chapter}
        </div>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">{chapter.title}</h2>
        <p className="mt-2 text-[15px] text-slate-500">{chapter.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-6">
        {chapter.journeys.map((journey, i) => (
          <JourneyCard key={journey.id} journey={journey} index={i} />
        ))}
      </div>
    </section>
  );
}