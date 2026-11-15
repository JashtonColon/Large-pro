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
import ProtectedRoute from "./components/ProtectedRoute";

// Shorthand: wrap a page so only logged-in users can see it
function privatePage(page: ReactNode) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

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
        <Route path="/availability" element={privatePage(<AvailabilityPage />)} />
        <Route path="/courses" element={privatePage(<CoursesPage />)} />
        <Route path="/profile" element={privatePage(<ProfilePage />)} />
        <Route path="/quests" element={privatePage(<FindQuestsPage />)} />
        <Route path="/create-quest" element={privatePage(<CreateQuestPage />)} />
        <Route path="/appointments" element={privatePage(<MyAppointmentsPage />)} />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
