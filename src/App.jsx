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
import { Navigate } from 'react-router-dom';
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
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
