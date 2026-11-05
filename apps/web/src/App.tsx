import { useState } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "login" | "register" | "forgotPassword" | "verifyEmail"
  >("login");

  const [verificationEmail, setVerificationEmail] = useState("");

  // Login Page
  if (currentPage === "login") {
    return (
      <LoginPage
        onCreateAccount={() => setCurrentPage("register")}
        onForgotPassword={() => setCurrentPage("forgotPassword")}
      />
    );
  }

  // Registration Page
  if (currentPage === "register") {
    return (
      <RegisterPage
        onLogin={() => setCurrentPage("login")}
        onRegistrationComplete={(email) => {
          setVerificationEmail(email);
          setCurrentPage("verifyEmail");
        }}
      />
    );
  }

  // Forgot Password Page
  if (currentPage === "forgotPassword") {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => setCurrentPage("login")}
      />
    );
  }

  // Email Verification Page
  return (
    <EmailVerificationPage
      email={verificationEmail}
      onBackToLogin={() => setCurrentPage("login")}
    />
  );
}