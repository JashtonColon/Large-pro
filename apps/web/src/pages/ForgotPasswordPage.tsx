import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(
      "If an account exists for this email, a reset link will be sent."
    );
  }

  return (
    <main className="login-page">
      <div className="login-card">

        {/* Branding */}
        <h1 className="login-brand">
          Knight Study Buddy
        </h1>

        <p className="login-subtitle">
          Reset your password.
        </p>

        {/* Page Heading */}
        <h2 className="login-heading">
          Forgot Password?
        </h2>

        {/* Instructions */}
        <p className="login-message">
          Enter your UCF email address and we'll send you
          instructions to reset your password.
        </p>

        {/* Password Reset Form */}
        <form onSubmit={handleSubmit}>

          <label className="login-field">
            UCF Email

            <input
              type="email"
              placeholder="yourname@ucf.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="login-input"
            />
          </label>

          <button
            type="submit"
            className="login-submit"
          >
            Send Reset Instructions
          </button>

        </form>

        {/* Response Message */}
        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        {/* Back to Login */}
        <div className="login-register">
          Remembered your password?{" "}

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>

      </div>
    </main>
  );
}