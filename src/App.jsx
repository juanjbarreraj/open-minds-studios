import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
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
import Register from './pages/Register.jsx';
import { Navigate } from 'react-router-dom';
import PageTransition from '@/components/ui/page-transition';
// Add page imports here

// Public pages render immediately; protected pages (dashboards) handle their
// own auth states, and the backend enforces every access rule regardless.
function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/Home" replace />} />
            <Route path="/Home" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/tutor-dashboard" element={<PageTransition><TutorDashboard /></PageTransition>} />
            <Route path="/manager-dashboard" element={<PageTransition><ManagerDashboard /></PageTransition>} />
            <Route path="/student-dashboard" element={<PageTransition><StudentDashboard /></PageTransition>} />
            <Route path="/subscription-plans" element={<PageTransition><SubscriptionPlans /></PageTransition>} />
            <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
            <Route path="/appointment-scheduling" element={<PageTransition><AppointmentScheduling /></PageTransition>} />
            <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
            <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
            <Route path="/payment-policy" element={<PageTransition><PaymentPolicy /></PageTransition>} />
            <Route path="/guide" element={<PageTransition><Guide /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="*" element={<PageTransition><PageNotFound /></PageTransition>} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
