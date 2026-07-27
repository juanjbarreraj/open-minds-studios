import React from 'react';
import { User, Mail, Phone, BookOpen } from 'lucide-react';

export default function TutorProfile({ tutor, courses }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <User className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">{tutor.full_name}</p>
          <p className="text-sm text-slate-500">Tutor</p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          {tutor.email}
        </div>
        {tutor.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" />
            {tutor.phone}
          </div>
        )}
      </div>

      {tutor.bio && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
          {tutor.bio}
        </p>
      )}

      {courses.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <BookOpen className="h-3.5 w-3.5" /> Courses
          </div>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <span key={c.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                {c.course_code} - {c.course_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}