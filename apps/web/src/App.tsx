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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default Page */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Authentication Pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* Main Application */}

        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/quests" element={<FindQuestsPage />} />
        <Route path="/create-quest" element={<CreateQuestPage />} />
        <Route path="/appointments" element={<MyAppointmentsPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />

        {/* Unknown URLs */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}