import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import TutorDashboard from './pages/TutorDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import StudentDashboard from './pages/StudentDashboard';
import SubscriptionPlans from './pages/SubscriptionPlans.jsx';
import Contact from './pages/Contact.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import AppointmentScheduling from './pages/AppointmentScheduling.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import PaymentPolicy from './pages/PaymentPolicy.jsx';
import Guide from './pages/Guide.jsx';
import { Navigate } from 'react-router-dom';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/tutor-dashboard" element={<TutorDashboard />} />
      <Route path="/manager-dashboard" element={<ManagerDashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/subscription-plans" element={<SubscriptionPlans />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/appointment-scheduling" element={<AppointmentScheduling />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/payment-policy" element={<PaymentPolicy />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App