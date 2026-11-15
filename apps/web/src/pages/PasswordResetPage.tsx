import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, errorMessage } from "../lib/authApi";

interface ResetPageState {
  email?: string;
  resetToken?: string;
}

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { email = "", resetToken: tokenFromState } = (location.state || {}) as ResetPageState;

  // The reset email links to /reset-password?token=<64 hex characters>
  const resetToken = searchParams.get("token") || tokenFromState || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!resetToken) {
      setError("This reset link is missing its token. Please use the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setMessage("Password reset successfully! Taking you to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(errorMessage(err)); // e.g. "Invalid or expired reset token"
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card password-reset-card">
        <h1 className="login-brand">Knight Study Buddy</h1>
        <p className="login-subtitle">A fresh start!</p>

        <h2 className="login-heading">Create a New Password</h2>

        <p className="login-message password-reset-intro">
          Choose a new password for your Knight Study Buddy account.
        </p>

        {email && (
          <p className="password-reset-email">
            Password for <strong>{email}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label className="login-field" htmlFor="new-password">
            New Password
            <input
              id="new-password"
              className="login-input"
              type="password"
              autoComplete="new-password"
              placeholder="Enter a new password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="login-field" htmlFor="confirm-password">
            Confirm New Password
            <input
              id="confirm-password"
              className="login-input"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          <p className="password-reset-hint">
            Your password must be at least 8 characters long.
          </p>

          {error && (
            <p className="password-reset-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="password-reset-success" role="status">
              {message}
            </p>
          )}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="login-register">
          Remembered your old password?{" "}
          <button type="button" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    </main>
  );
}
