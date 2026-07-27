import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Optional route-level guard. The dashboards currently render their own
// signed-out and pending-approval screens, so this is not wired into any route;
// it is available for routes that should redirect instead. Server-side checks
// remain the real authorization boundary.
export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement = null }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return fallback;
  if (!isAuthenticated) return unauthenticatedElement;
  return <Outlet />;
}
