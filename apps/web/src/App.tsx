import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import CoursesPage from "./pages/CoursesPage";
import ProfilePage from "./pages/ProfilePage";
import FindQuestsPage from "./pages/FindQuestsPage";
import CreateQuestPage from "./pages/CreateQuestPage";
import MyAppointmentsPage from "./pages/MyAppointmentsPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import WelcomePage from "./pages/WelcomePage";
import AboutPage from "./pages/AboutPage";
import CastleScene from "./components/theme/CastleScene";
import { TransitionProvider } from "./components/theme/Transitions";

// Shorthand: wrap a page so only logged-in users can see it
function privatePage(page: ReactNode) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <CastleScene />
      <TransitionProvider>
      <Routes>

        {/* Welcome page: what the app is, then Sign Up / Log In */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Authentication Pages (public) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        {/* The reset email links to /reset-password?token=... */}
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />

        {/* Main Application (logged-in users only) */}
        <Route path="/dashboard" element={<Navigate to="/quests" replace />} />
        {/* Profile setup saves to /api/profile, which needs a logged-in, verified user */}
        <Route path="/profile-setup" element={privatePage(<ProfileSetupPage />)} />
        <Route path="/availability" element={privatePage(<AvailabilityPage />)} />
        <Route path="/courses" element={privatePage(<CoursesPage />)} />
        <Route path="/profile" element={privatePage(<ProfilePage />)} />
        <Route path="/quests" element={privatePage(<FindQuestsPage />)} />
        <Route path="/create-quest" element={privatePage(<CreateQuestPage />)} />
        <Route path="/appointments" element={privatePage(<MyAppointmentsPage />)} />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </TransitionProvider>
    </BrowserRouter>
  );
}
