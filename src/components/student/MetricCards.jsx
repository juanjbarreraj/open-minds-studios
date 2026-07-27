import React from 'react';

export default function MetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderTop: '3px solid rgb(98,191,161)' }}
        >
          <div className="text-xs text-slate-500 mb-2">{m.label}</div>
          <div className="text-2xl font-bold text-slate-900">{m.value}</div>
        </div>
      ))}
    </div>
  );
}