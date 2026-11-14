import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ResetPageState {
  email?: string;
  resetToken?: string;
}

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email = "", resetToken } = (location.state || {}) as ResetPageState;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match. Please try again.");
      return;
    }

    // TODO: Send password, resetToken, and email to the password-reset API.
    // Only navigate to login after the backend confirms the reset succeeded.
    setMessage(
      "Your passwords match. Connect this form to the password-reset API to finish updating your password."
    );
  }

  return (
    <main className="login-page">
      <div className="login-card password-reset-card">
        <h1 className="login-brand">Study Buddy</h1>
        <p className="login-subtitle">A fresh start!</p>

        <h2 className="login-heading">Create a New Password</h2>

        <p className="login-message password-reset-intro">
          Your email has been verified. Choose a new password for your
          Study Buddy account.
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

          <button type="submit" className="login-submit">
            Reset Password
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
