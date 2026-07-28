import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, ShieldX, LayoutDashboard, Users, BookOpen, Link2, Clock, CalendarDays, Mail, LogOut, ArrowLeft } from 'lucide-react';
import SiteLogo from '../components/shared/SiteLogo';
import AuthModal from '@/components/landing/AuthModal';
import TutorManager from '../components/manager/TutorManager';
import CourseManager from '../components/manager/CourseManager';
import TutorCourseManager from '../components/manager/TutorCourseManager';
import AvailabilityAdminManager from '../components/manager/AvailabilityAdminManager';
import BookingManager from '../components/manager/BookingManager';
import StudentManager from '../components/manager/StudentManager';
import InquiryManager from '../components/manager/InquiryManager';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'tutors', label: 'Tutors', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'tutor-courses', label: 'Tutor Courses', icon: Link2 },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'inquiries', label: 'Inquiries', icon: Mail },
];

export default function ManagerDashboard() {
  const { user, tutor, isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tutors');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoadingAuth) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center gap-4">
      <ShieldX className="h-12 w-12 text-slate-300" />
      <h1 className="text-xl font-bold text-slate-800">Authentication Required</h1>
      <button onClick={() => setShowAuthModal(true)} className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Sign In</button>
      {showAuthModal && <AuthModal type="tutor" onClose={() => setShowAuthModal(false)} />}
    </div>
  );

  const hasAccess = tutor?.can_access_manager_dashboard || tutor?.is_super_admin || user.role === 'manager' || user.role === 'admin';

  if (!hasAccess) return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center gap-4">
      <ShieldX className="h-12 w-12 text-red-300" />
      <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
      <p className="text-slate-500 max-w-sm">You don't have permission to access the Manager Dashboard.</p>
      <Link to="/tutor-dashboard" className="mt-2 rounded-2xl border border-slate-200 px-6 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
        Back to Tutor Dashboard
      </Link>
    </div>
  );

  const isSuperAdmin = tutor?.is_super_admin || user.role === 'admin';

  const ActiveComponent = {
    tutors: TutorManager,
    courses: CourseManager,
    'tutor-courses': TutorCourseManager,
    availability: AvailabilityAdminManager,
    bookings: BookingManager,
    students: StudentManager,
    inquiries: InquiryManager,
  }[activeTab];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col border-b border-slate-100 px-5 py-4">
          <SiteLogo className="mb-3" />
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-indigo-500" />
            <div>
              <div className="text-sm font-bold text-slate-800">Manager Dashboard</div>
              <div className="text-xs text-slate-400">Internal Data Management</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${activeTab === id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 space-y-1">
          <Link to="/tutor-dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Tutor Dashboard
          </Link>
          <button onClick={() => logout()} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden rounded-lg border border-slate-200 p-2" onClick={() => setSidebarOpen(true)}>
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <div>
              <span className="font-semibold text-slate-800">{TABS.find(t => t.id === activeTab)?.label}</span>
              {isSuperAdmin && <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">Super Admin</span>}
            </div>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">{tutor?.full_name || user.full_name}</div>
        </header>
        <main className="flex-1 p-6">
          <ActiveComponent isSuperAdmin={isSuperAdmin} currentTutorId={tutor?.id} />
        </main>
      </div>
    </div>
  );
}
